import express from 'express';
import { CRMService } from '../services/crmService.js';
import { StudentService } from '../services/studentService.js';

export function setupCRMRoutes(app) {
  // CRM Dashboard
  app.get('/crm', async (req, res) => {
    try {
      const dashboardData = await CRMService.getDashboardData();
      const studentStats = await StudentService.getStudentStats();

      if (!dashboardData.success || !studentStats.success) {
        throw new Error('Failed to load dashboard data');
      }

      const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CRM Dashboard - TechLab Digital Solutions</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: #f5f7fa;
                  color: #333;
              }
              
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px 0;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 0 20px;
              }
              
              .header h1 {
                  font-size: 28px;
                  font-weight: 700;
              }
              
              .header p {
                  opacity: 0.9;
                  margin-top: 5px;
              }
              
              .dashboard {
                  padding: 30px 0;
              }
              
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 20px;
                  margin-bottom: 40px;
              }
              
              .stat-card {
                  background: white;
                  border-radius: 12px;
                  padding: 24px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                  transition: transform 0.3s ease;
              }
              
              .stat-card:hover {
                  transform: translateY(-5px);
              }
              
              .stat-card h3 {
                  color: #666;
                  font-size: 14px;
                  font-weight: 500;
                  margin-bottom: 8px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .stat-card .number {
                  font-size: 32px;
                  font-weight: 700;
                  color: #333;
                  margin-bottom: 4px;
              }
              
              .stat-card .label {
                  color: #888;
                  font-size: 14px;
              }
              
              .section {
                  background: white;
                  border-radius: 12px;
                  padding: 30px;
                  margin-bottom: 30px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
              }
              
              .section h2 {
                  font-size: 20px;
                  font-weight: 600;
                  margin-bottom: 20px;
                  color: #333;
              }
              
              .activities-list {
                  max-height: 400px;
                  overflow-y: auto;
              }
              
              .activity-item {
                  display: flex;
                  align-items: flex-start;
                  padding: 16px 0;
                  border-bottom: 1px solid #eee;
              }
              
              .activity-item:last-child {
                  border-bottom: none;
              }
              
              .activity-icon {
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: #f0f2f5;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 16px;
                  flex-shrink: 0;
              }
              
              .activity-content {
                  flex: 1;
              }
              
              .activity-content h4 {
                  font-size: 14px;
                  font-weight: 600;
                  margin-bottom: 4px;
                  color: #333;
              }
              
              .activity-content p {
                  font-size: 13px;
                  color: #666;
                  margin-bottom: 4px;
              }
              
              .activity-time {
                  font-size: 12px;
                  color: #999;
              }
              
              .course-breakdown {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 16px;
              }
              
              .course-item {
                  background: #f8f9fa;
                  border-radius: 8px;
                  padding: 16px;
                  text-align: center;
              }
              
              .course-item h4 {
                  font-size: 16px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #333;
              }
              
              .course-item .count {
                  font-size: 24px;
                  font-weight: 700;
                  color: #667eea;
              }
              
              .empty-state {
                  text-align: center;
                  padding: 40px;
                  color: #666;
              }
              
              .refresh-btn {
                  background: #667eea;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: background 0.3s ease;
              }
              
              .refresh-btn:hover {
                  background: #5a67d8;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="container">
                  <h1>🤖 CRM Dashboard</h1>
                  <p>TechLab Digital Solutions - Управление клиентами</p>
              </div>
          </div>
          
          <div class="container dashboard">
              <div class="stats-grid">
                  <div class="stat-card">
                      <h3>Всего студентов</h3>
                      <div class="number">${studentStats.stats.totalStudents}</div>
                      <div class="label">зарегистрировано</div>
                  </div>
                  
                  <div class="stat-card">
                      <h3>Активные записи</h3>
                      <div class="number">${studentStats.stats.activeEnrollments}</div>
                      <div class="label">подтверждено</div>
                  </div>
                  
                  <div class="stat-card">
                      <h3>Ожидают оплаты</h3>
                      <div class="number">${studentStats.stats.pendingPayments}</div>
                      <div class="label">заявок</div>
                  </div>
                  
                  <div class="stat-card">
                      <h3>Всего записей</h3>
                      <div class="number">${dashboardData.data.stats.totalEnrollments}</div>
                      <div class="label">за все время</div>
                  </div>
              </div>
              
              <div class="section">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                      <h2>📊 Статистика по курсам</h2>
                  </div>
                  
                  <div class="course-breakdown">
                      ${Object.entries(dashboardData.data.stats.courseBreakdown).map(([course, count]) => `
                          <div class="course-item">
                              <h4>${course}</h4>
                              <div class="count">${count}</div>
                          </div>
                      `).join('')}
                  </div>
              </div>
              
              <div class="section">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                      <h2>📝 Последние активности</h2>
                      <button class="refresh-btn" onclick="location.reload()">Обновить</button>
                  </div>
                  
                  <div class="activities-list">
                      ${dashboardData.data.activities.length > 0 ? 
                        dashboardData.data.activities.map(activity => `
                          <div class="activity-item">
                              <div class="activity-icon">
                                  ${getActivityIcon(activity.activity_type)}
                              </div>
                              <div class="activity-content">
                                  <h4>${activity.students?.name || 'Неизвестный пользователь'}</h4>
                                  <p>${activity.description}</p>
                                  <div class="activity-time">${new Date(activity.created_at).toLocaleString('ru-RU')}</div>
                              </div>
                          </div>
                        `).join('') : 
                        '<div class="empty-state">Пока нет активностей</div>'
                      }
                  </div>
              </div>
          </div>
          
          <script>
              function getActivityIcon(type) {
                  const icons = {
                      'registration': '👤',
                      'payment_created': '💳',
                      'payment_updated': '💰',
                      'enrollment': '📚',
                      'message': '💬'
                  };
                  return icons[type] || '📝';
              }
              
              // Auto-refresh every 30 seconds
              setTimeout(() => {
                  location.reload();
              }, 30000);
          </script>
      </body>
      </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('CRM Dashboard error:', error);
      res.status(500).send('Error loading dashboard');
    }
  });

  // API endpoint for dashboard data
  app.get('/api/crm/dashboard', async (req, res) => {
    try {
      const dashboardData = await CRMService.getDashboardData();
      const studentStats = await StudentService.getStudentStats();

      res.json({
        success: true,
        data: {
          dashboard: dashboardData.data,
          stats: studentStats.stats
        }
      });
    } catch (error) {
      console.error('CRM API error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

function getActivityIcon(type) {
  const icons = {
    'registration': '👤',
    'payment_created': '💳',
    'payment_updated': '💰',
    'enrollment': '📚',
    'message': '💬'
  };
  return icons[type] || '📝';
}