/**
 * User Service
 * Handles user-related business logic including onboarding
 */

class UserService {
  constructor(fastify) {
    this.db = fastify.db;
  }

  /**
   * Complete user onboarding
   * Creates/updates organization with user type and details
   */
  async completeOnboarding(userId, data) {
    const { type, coupleNames, eventDate, businessName, website, businessType } = data;
    
    // Get user details
    const userResult = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    let organizationId = user.organization_id;
    let organizationName;

    // Generate organization name based on type
    if (type === 'COUPLE' && coupleNames) {
      organizationName = `${coupleNames.partner1} & ${coupleNames.partner2}`;
    } else if (businessName) {
      organizationName = businessName;
    } else {
      organizationName = user.full_name || user.email;
    }

    // Prepare organization data
    const orgData = {
      type,
      name: organizationName,
      couple_names: coupleNames ? JSON.stringify(coupleNames) : null,
      event_date: eventDate || null,
      website: website || null,
      business_type: businessType || type,
    };

    if (organizationId) {
      // Update existing organization
      await this.db.query(`
        UPDATE organizations 
        SET type = $1, name = $2, couple_names = $3, event_date = $4, 
            website = $5, business_type = $6, updated_at = NOW()
        WHERE id = $7
      `, [orgData.type, orgData.name, orgData.couple_names, orgData.event_date, 
          orgData.website, orgData.business_type, organizationId]);
    } else {
      // Create new organization
      const orgResult = await this.db.query(`
        INSERT INTO organizations (type, name, couple_names, event_date, website, business_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [orgData.type, orgData.name, orgData.couple_names, orgData.event_date, 
          orgData.website, orgData.business_type]);
      
      organizationId = orgResult.rows[0].id;
      
      // Link user to organization
      await this.db.query(
        'UPDATE users SET organization_id = $1 WHERE id = $2',
        [organizationId, userId]
      );
    }

    // Mark onboarding as complete
    await this.db.query(
      'UPDATE users SET onboarding_completed = true WHERE id = $1',
      [userId]
    );

    // Return updated organization
    const orgResult = await this.db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [organizationId]
    );

    return orgResult.rows[0];
  }

  /**
   * Update user's selected plan
   */
  async updatePlan(userId, plan) {
    const validPlans = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    
    if (!validPlans.includes(plan)) {
      throw new Error('Invalid plan selected');
    }

    await this.db.query(
      'UPDATE users SET selected_plan = $1 WHERE id = $2',
      [plan, userId]
    );

    return { success: true, plan };
  }

  /**
   * Get user's organization details
   */
  async getOrganization(userId) {
    const result = await this.db.query(`
      SELECT o.* 
      FROM organizations o
      JOIN users u ON u.organization_id = o.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const org = result.rows[0];
    
    // Parse JSON fields
    if (org.couple_names) {
      org.couple_names = JSON.parse(org.couple_names);
    }

    return org;
  }

  /**
   * Get current user with organization
   */
  async getMe(userId) {
    const result = await this.db.query(`
      SELECT u.*, o.type as org_type, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

module.exports = function(fastify) {
  return new UserService(fastify);
};
