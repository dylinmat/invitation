/**
 * Readiness and Trust Scoring System for Messaging Campaigns
 * 
 * Gate outcomes:
 * - ALLOW: Send at normal rate
 * - THROTTLED: Reduced per-minute rate
 * - BLOCKED: Requires admin override
 */

const { query } = require("../../db");

// Scoring weights and thresholds
const WEIGHTS = {
  domainVerification: 30,
  listHygiene: 25,
  orgHistory: 20,
  compliance: 15,
  abuseSignals: 10
};

const THRESHOLDS = {
  allow: 80,
  throttle: 50
};

const BOUNCE_RATE_THRESHOLD = {
  critical: 0.10,  // 10% - immediate block
  warning: 0.05    // 5% - throttled
};

const COMPLAINT_RATE_THRESHOLD = {
  critical: 0.005, // 0.5% - immediate block
  warning: 0.001   // 0.1% - throttled
};

/**
 * Check domain verification status (SPF, DKIM, DMARC)
 * Returns score 0-30 based on verification level
 */
const calculateDomainVerificationScore = async (projectId) => {
  try {
    // Query domain verification status from settings or dedicated table
    const result = await query(
      `select 
        (select value->>'verified' from settings_values 
         where scope = 'PROJECT' and scope_id = $1 and key = 'email_domain_spf') as spf_verified,
        (select value->>'verified' from settings_values 
         where scope = 'PROJECT' and scope_id = $1 and key = 'email_domain_dkim') as dkim_verified,
        (select value->>'verified' from settings_values 
         where scope = 'PROJECT' and scope_id = $1 and key = 'email_domain_dmarc') as dmarc_verified`,
      [projectId]
    );

    const { spf_verified, dkim_verified, dmarc_verified } = result.rows[0] || {};
    
    let score = 0;
    if (spf_verified === 'true') score += 10;
    if (dkim_verified === 'true') score += 10;
    if (dmarc_verified === 'true') score += 10;

    return {
      score,
      maxScore: WEIGHTS.domainVerification,
      details: {
        spf: spf_verified === 'true',
        dkim: dkim_verified === 'true',
        dmarc: dmarc_verified === 'true'
      }
    };
  } catch (error) {
    return {
      score: 0,
      maxScore: WEIGHTS.domainVerification,
      details: { error: error.message },
      spf: false,
      dkim: false,
      dmarc: false
    };
  }
};

/**
 * Calculate list hygiene score based on bounce and complaint rates
 * Returns score 0-25
 */
const calculateListHygieneScore = async (projectId) => {
  try {
    // Get bounce and complaint rates from recent campaigns
    const result = await query(
      `select 
        count(distinct mj.id) as total_sent,
        count(distinct case when me.event_type = 'BOUNCED' then me.id end) as bounces,
        count(distinct case when me.event_type = 'COMPLAINED' then me.id end) as complaints
       from message_jobs mj
       join messaging_campaigns mc on mj.campaign_id = mc.id
       left join message_events me on mj.id = me.message_job_id
       where mc.project_id = $1
       and mc.created_at > now() - interval '30 days'`,
      [projectId]
    );

    const { total_sent, bounces, complaints } = result.rows[0];
    const totalSent = parseInt(total_sent || "0", 10);
    
    if (totalSent === 0) {
      // No history - neutral score
      return {
        score: WEIGHTS.listHygiene / 2,
        maxScore: WEIGHTS.listHygiene,
        details: {
          bounceRate: 0,
          complaintRate: 0,
          totalSent: 0,
          note: 'No send history'
        }
      };
    }

    const bounceRate = parseInt(bounces || "0", 10) / totalSent;
    const complaintRate = parseInt(complaints || "0", 10) / totalSent;

    let score = WEIGHTS.listHygiene;

    // Deduct for high bounce rate
    if (bounceRate >= BOUNCE_RATE_THRESHOLD.critical) {
      score = 0;
    } else if (bounceRate >= BOUNCE_RATE_THRESHOLD.warning) {
      score -= WEIGHTS.listHygiene * 0.5;
    } else if (bounceRate > 0) {
      score -= WEIGHTS.listHygiene * 0.2;
    }

    // Deduct for complaints
    if (complaintRate >= COMPLAINT_RATE_THRESHOLD.critical) {
      score = 0;
    } else if (complaintRate >= COMPLAINT_RATE_THRESHOLD.warning) {
      score -= WEIGHTS.listHygiene * 0.5;
    } else if (complaintRate > 0) {
      score -= WEIGHTS.listHygiene * 0.2;
    }

    return {
      score: Math.max(0, score),
      maxScore: WEIGHTS.listHygiene,
      details: {
        bounceRate: Math.round(bounceRate * 10000) / 10000,
        complaintRate: Math.round(complaintRate * 10000) / 10000,
        totalSent,
        bounces: parseInt(bounces || "0", 10),
        complaints: parseInt(complaints || "0", 10)
      }
    };
  } catch (error) {
    return {
      score: 0,
      maxScore: WEIGHTS.listHygiene,
      details: { error: error.message }
    };
  }
};

/**
 * Calculate organization history score based on age and prior sends
 * Returns score 0-20
 */
const calculateOrgHistoryScore = async (projectId) => {
  try {
    // Get organization age and prior send history
    const result = await query(
      `select 
        o.id as org_id,
        o.created_at as org_created_at,
        count(distinct mc.id) as total_campaigns,
        count(distinct mj.id) as total_messages,
        max(mc.created_at) as last_campaign_at
       from projects p
       join organizations o on p.owner_org_id = o.id
       left join messaging_campaigns mc on mc.project_id = p.id
       left join message_jobs mj on mj.campaign_id = mc.id
       where p.id = $1
       group by o.id, o.created_at`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return {
        score: 0,
        maxScore: WEIGHTS.orgHistory,
        details: { error: 'Organization not found' }
      };
    }

    const row = result.rows[0];
    const orgCreatedAt = new Date(row.org_created_at);
    const orgAgeDays = (Date.now() - orgCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const totalCampaigns = parseInt(row.total_campaigns || "0", 10);
    const totalMessages = parseInt(row.total_messages || "0", 10);

    let score = 0;

    // Age factor (up to 10 points)
    if (orgAgeDays >= 90) {
      score += 10;
    } else if (orgAgeDays >= 30) {
      score += 7;
    } else if (orgAgeDays >= 7) {
      score += 4;
    } else {
      score += 2;
    }

    // Prior sends factor (up to 10 points)
    if (totalMessages >= 1000) {
      score += 10;
    } else if (totalMessages >= 500) {
      score += 7;
    } else if (totalMessages >= 100) {
      score += 5;
    } else if (totalMessages >= 10) {
      score += 3;
    } else if (totalCampaigns > 0) {
      score += 2;
    }

    return {
      score,
      maxScore: WEIGHTS.orgHistory,
      details: {
        orgAgeDays: Math.floor(orgAgeDays),
        totalCampaigns,
        totalMessages,
        lastCampaignAt: row.last_campaign_at
      }
    };
  } catch (error) {
    return {
      score: 0,
      maxScore: WEIGHTS.orgHistory,
      details: { error: error.message }
    };
  }
};

/**
 * Check compliance settings (unsubscribe, suppression list)
 * Returns score 0-15
 */
const calculateComplianceScore = async (projectId) => {
  try {
    // Check if unsubscribe compliance is enabled
    const result = await query(
      `select value from settings_values
       where scope = 'PROJECT' and scope_id = $1 and key = 'unsubscribe_compliance'`,
      [projectId]
    );

    const unsubscribeEnabled = result.rows[0]?.value === 'true' || result.rows[0]?.value === true;

    // Check suppression list is being used
    const suppressionResult = await query(
      `select count(*) as count from suppressed_contacts where project_id = $1`,
      [projectId]
    );
    const hasSuppressionList = parseInt(suppressionResult.rows[0]?.count || "0", 10) >= 0;

    let score = 0;
    if (unsubscribeEnabled) score += 10;
    if (hasSuppressionList) score += 5;

    return {
      score,
      maxScore: WEIGHTS.compliance,
      details: {
        unsubscribeEnabled,
        hasSuppressionList
      }
    };
  } catch (error) {
    return {
      score: 0,
      maxScore: WEIGHTS.compliance,
      details: { error: error.message }
    };
  }
};

/**
 * Detect abuse signals (rapid guest imports + large sends)
 * Returns score 0-10 (lower is better for abuse detection)
 */
const calculateAbuseScore = async (projectId) => {
  try {
    // Check for rapid guest imports
    const guestImportResult = await query(
      `select 
        count(*) as total_guests,
        max(created_at) as last_guest_added,
        min(created_at) as first_guest_added
       from guests
       where project_id = $1
       and created_at > now() - interval '24 hours'`,
      [projectId]
    );

    const recentGuests = parseInt(guestImportResult.rows[0]?.total_guests || "0", 10);
    
    // Check for recent large campaigns
    const largeCampaignResult = await query(
      `select count(*) as count
       from messaging_campaigns mc
       join message_jobs mj on mj.campaign_id = mc.id
       where mc.project_id = $1
       and mc.created_at > now() - interval '24 hours'
       group by mc.id
       having count(mj.id) > 100`,
      [projectId]
    );

    const hasLargeRecentCampaign = largeCampaignResult.rows.length > 0;

    // Abuse signals detection
    let abuseSignals = [];
    let score = WEIGHTS.abuseSignals; // Start with full score

    // Rapid import signal (>500 guests in 24h is suspicious for new orgs)
    if (recentGuests > 500) {
      abuseSignals.push({
        type: 'RAPID_GUEST_IMPORT',
        severity: 'HIGH',
        details: `${recentGuests} guests added in last 24 hours`
      });
      score -= 7;
    } else if (recentGuests > 200) {
      abuseSignals.push({
        type: 'RAPID_GUEST_IMPORT',
        severity: 'MEDIUM',
        details: `${recentGuests} guests added in last 24 hours`
      });
      score -= 3;
    }

    // Large campaign immediately after import
    if (hasLargeRecentCampaign && recentGuests > 100) {
      abuseSignals.push({
        type: 'LARGE_SEND_AFTER_IMPORT',
        severity: 'HIGH',
        details: 'Large campaign sent shortly after guest import'
      });
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      maxScore: WEIGHTS.abuseSignals,
      details: {
        recentGuests,
        hasLargeRecentCampaign,
        abuseSignals
      }
    };
  } catch (error) {
    return {
      score: 0,
      maxScore: WEIGHTS.abuseSignals,
      details: { error: error.message }
    };
  }
};

/**
 * Calculate overall campaign readiness score
 * Returns detailed scoring breakdown and gate outcome
 */
const calculateReadiness = async (projectId) => {
  const [
    domainScore,
    hygieneScore,
    historyScore,
    complianceScore,
    abuseScore
  ] = await Promise.all([
    calculateDomainVerificationScore(projectId),
    calculateListHygieneScore(projectId),
    calculateOrgHistoryScore(projectId),
    calculateComplianceScore(projectId),
    calculateAbuseScore(projectId)
  ]);

  const totalScore = Math.round(
    domainScore.score + 
    hygieneScore.score + 
    historyScore.score + 
    complianceScore.score + 
    abuseScore.score
  );

  const maxPossibleScore = WEIGHTS.domainVerification + WEIGHTS.listHygiene + 
                          WEIGHTS.orgHistory + WEIGHTS.compliance + WEIGHTS.abuseSignals;

  // Determine gate outcome
  let outcome;
  if (totalScore >= THRESHOLDS.allow) {
    outcome = 'ALLOW';
  } else if (totalScore >= THRESHOLDS.throttle) {
    outcome = 'THROTTLED';
  } else {
    outcome = 'BLOCKED';
  }

  // Check for critical abuse signals that force block
  const criticalAbuseSignals = abuseScore.details.abuseSignals?.filter(
    s => s.severity === 'HIGH'
  ) || [];
  
  if (criticalAbuseSignals.length >= 2 && outcome !== 'BLOCKED') {
    outcome = 'BLOCKED';
  }

  // Check for critical bounce/complaint rates
  const bounceRate = hygieneScore.details.bounceRate || 0;
  const complaintRate = hygieneScore.details.complaintRate || 0;
  
  if (bounceRate >= BOUNCE_RATE_THRESHOLD.critical || 
      complaintRate >= COMPLAINT_RATE_THRESHOLD.critical) {
    outcome = 'BLOCKED';
  }

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.round((totalScore / maxPossibleScore) * 100),
    outcome,
    factors: {
      domainVerification: domainScore,
      listHygiene: hygieneScore,
      orgHistory: historyScore,
      compliance: complianceScore,
      abuseSignals: abuseScore
    },
    requiresAdminApproval: outcome === 'BLOCKED'
  };
};

/**
 * Check if a campaign requires manual admin approval
 */
const requiresAdminApproval = async (projectId) => {
  const readiness = await calculateReadiness(projectId);
  return readiness.outcome === 'BLOCKED';
};

module.exports = {
  calculateReadiness,
  requiresAdminApproval,
  calculateDomainVerificationScore,
  calculateListHygieneScore,
  calculateOrgHistoryScore,
  calculateComplianceScore,
  calculateAbuseScore,
  THRESHOLDS,
  BOUNCE_RATE_THRESHOLD,
  COMPLAINT_RATE_THRESHOLD
};
