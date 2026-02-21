/**
 * Team Repository
 * Database queries for team members and invitations
 */

class TeamRepository {
  constructor(db) {
    this.db = db;
  }

  // ============== Team Members ==============

  /**
   * List all team members for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>}
   */
  async listTeamMembers(organizationId) {
    const result = await this.db.query(
      `SELECT 
        tm.id,
        tm.organization_id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.joined_at,
        u.email,
        u.full_name as full_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.organization_id = $1
      ORDER BY tm.joined_at DESC`,
      [organizationId]
    );
    return result.rows;
  }

  /**
   * Get a team member by ID
   * @param {string} id - Team member ID
   * @returns {Promise<object|null>}
   */
  async getTeamMemberById(id) {
    const result = await this.db.query(
      `SELECT 
        tm.*,
        u.email,
        u.full_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get a team member by organization and user ID
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  async getTeamMember(organizationId, userId) {
    const result = await this.db.query(
      `SELECT * FROM team_members 
       WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Add a new team member
   * @param {object} data - Member data
   * @returns {Promise<object>}
   */
  async addTeamMember({ organizationId, userId, role = 'member', status = 'active' }) {
    const result = await this.db.query(
      `INSERT INTO team_members (organization_id, user_id, role, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [organizationId, userId, role, status]
    );
    return result.rows[0];
  }

  /**
   * Remove a team member
   * @param {string} id - Team member ID
   * @returns {Promise<boolean>}
   */
  async removeTeamMember(id) {
    const result = await this.db.query(
      `DELETE FROM team_members WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * Update team member role
   * @param {string} id - Team member ID
   * @param {string} role - New role
   * @returns {Promise<object|null>}
   */
  async updateTeamMemberRole(id, role) {
    const result = await this.db.query(
      `UPDATE team_members 
       SET role = $1
       WHERE id = $2
       RETURNING *`,
      [role, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Count team members by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countTeamMembers(organizationId) {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM team_members WHERE organization_id = $1`,
      [organizationId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Count admins in an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countAdmins(organizationId) {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM team_members 
       WHERE organization_id = $1 AND role = 'admin'`,
      [organizationId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // ============== Invitations ==============

  /**
   * List all pending invites for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>}
   */
  async listPendingInvites(organizationId) {
    const result = await this.db.query(
      `SELECT 
        ti.*,
        inviter.full_name as invited_by_name
      FROM team_invites ti
      LEFT JOIN users inviter ON ti.invited_by = inviter.id
      WHERE ti.organization_id = $1 
        AND ti.accepted_at IS NULL
        AND ti.expires_at > NOW()
      ORDER BY ti.created_at DESC`,
      [organizationId]
    );
    return result.rows;
  }

  /**
   * Get invite by ID
   * @param {string} id - Invite ID
   * @returns {Promise<object|null>}
   */
  async getInviteById(id) {
    const result = await this.db.query(
      `SELECT 
        ti.*,
        inviter.full_name as invited_by_name,
        o.name as organization_name
      FROM team_invites ti
      LEFT JOIN users inviter ON ti.invited_by = inviter.id
      JOIN organizations o ON ti.organization_id = o.id
      WHERE ti.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get invite by token
   * @param {string} token - Invite token
   * @returns {Promise<object|null>}
   */
  async getInviteByToken(token) {
    const result = await this.db.query(
      `SELECT 
        ti.*,
        inviter.full_name as invited_by_name,
        o.name as organization_name
      FROM team_invites ti
      LEFT JOIN users inviter ON ti.invited_by = inviter.id
      JOIN organizations o ON ti.organization_id = o.id
      WHERE ti.token = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Get pending invite by email and organization
   * @param {string} organizationId - Organization ID
   * @param {string} email - Email address
   * @returns {Promise<object|null>}
   */
  async getPendingInviteByEmail(organizationId, email) {
    const result = await this.db.query(
      `SELECT * FROM team_invites 
       WHERE organization_id = $1 
         AND email = LOWER($2)
         AND accepted_at IS NULL
         AND expires_at > NOW()`,
      [organizationId, email]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new team invite
   * @param {object} data - Invite data
   * @returns {Promise<object>}
   */
  async createInvite({ organizationId, email, role, token, invitedBy, expiresAt }) {
    const result = await this.db.query(
      `INSERT INTO team_invites (organization_id, email, role, token, invited_by, expires_at)
       VALUES ($1, LOWER($2), $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, email, role, token, invitedBy, expiresAt]
    );
    return result.rows[0];
  }

  /**
   * Update invite token (for resending)
   * @param {string} id - Invite ID
   * @param {string} token - New token
   * @param {Date} expiresAt - New expiration date
   * @returns {Promise<object|null>}
   */
  async updateInviteToken(id, token, expiresAt) {
    const result = await this.db.query(
      `UPDATE team_invites 
       SET token = $1, expires_at = $2, created_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [token, expiresAt, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Mark invite as accepted
   * @param {string} id - Invite ID
   * @returns {Promise<object|null>}
   */
  async acceptInvite(id) {
    const result = await this.db.query(
      `UPDATE team_invites 
       SET accepted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete an invite
   * @param {string} id - Invite ID
   * @returns {Promise<boolean>}
   */
  async deleteInvite(id) {
    const result = await this.db.query(
      `DELETE FROM team_invites WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * Delete expired invites
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async deleteExpiredInvites(organizationId) {
    const result = await this.db.query(
      `DELETE FROM team_invites 
       WHERE organization_id = $1 
         AND expires_at < NOW()
         AND accepted_at IS NULL
       RETURNING *`,
      [organizationId]
    );
    return result.rows.length;
  }

  // ============== Users ==============

  /**
   * Get user by email
   * @param {string} email - Email address
   * @returns {Promise<object|null>}
   */
  async getUserByEmail(email) {
    const result = await this.db.query(
      `SELECT * FROM users WHERE email = LOWER($1)`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<object|null>}
   */
  async getUserById(id) {
    const result = await this.db.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get organization by ID
   * @param {string} id - Organization ID
   * @returns {Promise<object|null>}
   */
  async getOrganizationById(id) {
    const result = await this.db.query(
      `SELECT * FROM organizations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = function(db) {
  return new TeamRepository(db);
};
