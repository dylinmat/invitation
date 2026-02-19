/**
 * Dashboard Service
 * Handles dashboard data aggregation for couple and business views
 */

class DashboardService {
  constructor(fastify) {
    this.db = fastify.db;
  }

  /**
   * Get couple dashboard data
   */
  async getCoupleDashboard(userId, organizationId) {
    // Get organization details
    const orgResult = await this.db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [organizationId]
    );
    
    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = orgResult.rows[0];

    // Get or create primary event
    let eventResult = await this.db.query(
      'SELECT * FROM events WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1',
      [organizationId]
    );

    let event;
    if (eventResult.rows.length === 0) {
      // Create default event for new couples
      const eventDate = org.event_date || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
      const newEvent = await this.db.query(`
        INSERT INTO events (organization_id, name, date, status, max_guests)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [organizationId, 'Our Wedding', eventDate, 'ACTIVE', 150]);
      event = newEvent.rows[0];
    } else {
      event = eventResult.rows[0];
    }

    // Calculate days left
    const eventDate = new Date(event.date);
    const today = new Date();
    const daysLeft = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

    // Get guest stats
    const guestStats = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'DECLINED' THEN 1 END) as declined,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending
      FROM guests 
      WHERE event_id = $1
    `, [event.id]);

    const stats = guestStats.rows[0];
    const rsvpRate = stats.total > 0 
      ? Math.round(((parseInt(stats.accepted) + parseInt(stats.declined)) / parseInt(stats.total)) * 100)
      : 0;

    // Get checklist items
    const checklistResult = await this.db.query(`
      SELECT * FROM checklists 
      WHERE organization_id = $1 
      ORDER BY created_at ASC
    `, [organizationId]);

    let checklist = checklistResult.rows;

    // Create default checklist if empty
    if (checklist.length === 0) {
      const defaultItems = [
        { text: 'Send invitations', category: 'communication' },
        { text: 'Book venue', category: 'venue' },
        { text: 'Choose caterer', category: 'food' },
        { text: 'Select photographer', category: 'vendor' },
        { text: 'Plan honeymoon', category: 'planning' },
        { text: 'Order flowers', category: 'vendor' }
      ];

      for (const item of defaultItems) {
        await this.db.query(`
          INSERT INTO checklists (organization_id, text, category, completed)
          VALUES ($1, $2, $3, $4)
        `, [organizationId, item.text, item.category, false]);
      }

      // Fetch again
      const newChecklist = await this.db.query(`
        SELECT * FROM checklists WHERE organization_id = $1 ORDER BY created_at ASC
      `, [organizationId]);
      checklist = newChecklist.rows;
    }

    // Get recent activity
    const activityResult = await this.db.query(`
      SELECT * FROM activities 
      WHERE organization_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [organizationId]);

    // If no activity, create sample data
    let recentActivity = activityResult.rows;
    if (recentActivity.length === 0) {
      recentActivity = [
        { type: 'rsvp', message: 'Welcome to EIOS! Start planning your perfect day.', time: 'Just now' }
      ];
    }

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        daysLeft: Math.max(0, daysLeft),
        venue: event.venue || 'Garden Venue',
        guestCount: event.max_guests
      },
      stats: {
        guests: parseInt(stats.total) || 0,
        rsvpRate,
        daysLeft: Math.max(0, daysLeft),
        gifts: 0 // TODO: Implement gift tracking
      },
      checklist: checklist.map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        category: item.category
      })),
      recentActivity: recentActivity.map(activity => ({
        type: activity.type,
        message: activity.message,
        time: this.formatTimeAgo(activity.created_at)
      }))
    };
  }

  /**
   * Get business dashboard data
   */
  async getBusinessDashboard(userId, organizationId) {
    // Get all events for this organization
    const eventsResult = await this.db.query(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as guest_count
      FROM events e 
      WHERE e.organization_id = $1 
      ORDER BY e.date ASC
    `, [organizationId]);

    const events = eventsResult.rows;

    // Get clients (distinct from events)
    const clientsResult = await this.db.query(`
      SELECT DISTINCT 
        e.id,
        e.name,
        e.type,
        e.date,
        e.status,
        e.max_guests as guests,
        0 as revenue  -- TODO: Calculate from invoices
      FROM events e
      WHERE e.organization_id = $1
      ORDER BY e.date ASC
      LIMIT 10
    `, [organizationId]);

    // Get team members
    const teamResult = await this.db.query(`
      SELECT u.id, u.full_name as name, u.email,
        CASE 
          WHEN o.user_id = u.id THEN 'Owner'
          ELSE 'Member'
        END as role
      FROM users u
      JOIN organization_members om ON om.user_id = u.id
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.organization_id = $1
      LIMIT 10
    `, [organizationId]);

    // Get invoices
    const invoicesResult = await this.db.query(`
      SELECT * FROM invoices 
      WHERE organization_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [organizationId]);

    // Calculate analytics
    const totalRevenue = invoicesResult.rows
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.amount), 0);

    const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
    const totalGuests = events.reduce((sum, e) => sum + (parseInt(e.guest_count) || 0), 0);

    // Mock conversion rate (TODO: Calculate from actual data)
    const conversionRate = 78;

    return {
      clients: clientsResult.rows.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        date: c.date,
        status: c.status.toLowerCase(),
        guests: c.guests,
        revenue: c.revenue
      })),
      events: events.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date,
        status: e.status.toLowerCase(),
        guests: parseInt(e.guest_count) || 0,
        revenue: 0 // TODO
      })),
      teamMembers: teamResult.rows.map(t => ({
        id: t.id,
        name: t.name,
        role: t.role,
        avatar: t.name.split(' ').map(n => n[0]).join('').toUpperCase()
      })),
      invoices: invoicesResult.rows.map(i => ({
        id: i.invoice_number || i.id,
        client: i.client_name,
        amount: parseFloat(i.amount),
        status: i.status,
        date: i.created_at
      })),
      analytics: {
        totalRevenue,
        activeEvents,
        totalGuests,
        conversionRate
      }
    };
  }

  /**
   * Send RSVP reminders for an event
   */
  async sendReminders(eventId, userId, data) {
    // Get guests who haven't RSVPed
    const guestsResult = await this.db.query(`
      SELECT g.*, e.name as event_name, e.date as event_date
      FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.event_id = $1 AND g.status = 'PENDING'
    `, [eventId]);

    const guests = guestsResult.rows;

    // TODO: Queue emails via background job
    // For now, just log and return count
    console.log(`Would send reminders to ${guests.length} guests for event ${eventId}`);

    // Create activity log
    await this.db.query(`
      INSERT INTO activities (organization_id, type, message, metadata)
      SELECT organization_id, 'reminder', $1, $2
      FROM events WHERE id = $3
    `, [`RSVP reminders sent to ${guests.length} guests`, JSON.stringify({ count: guests.length }), eventId]);

    return { count: guests.length };
  }

  /**
   * Format timestamp to "time ago"
   */
  formatTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return then.toLocaleDateString();
  }
}

module.exports = function(fastify) {
  return new DashboardService(fastify);
};
