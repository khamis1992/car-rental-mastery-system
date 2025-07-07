export interface DocumentGuide {
  id: string;
  title: string;
  content: string;
  description: string;
}

export class HTMLDocumentsService {
  private readonly guides: Record<string, DocumentGuide> = {
    'user-manual': {
      id: 'user-manual',
      title: 'دليل المستخدم الشامل - نظام إدارة تأجير المركبات',
      description: 'دليل موسوعي شامل يغطي جميع جوانب النظام بالتفصيل',
      content: `
        <style>
          .guide-content {
            font-family: 'Tajawal', 'Cairo', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          
          .cover-page {
            text-align: center;
            padding: 60px 0;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 40px;
            page-break-after: always;
          }
          
          .cover-page h1 {
            font-size: 42px;
            color: #1e40af;
            margin-bottom: 20px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          
          .cover-page h2 {
            font-size: 28px;
            color: #374151;
            margin-bottom: 40px;
            font-weight: 600;
          }
          
          .company-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 30px auto;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .company-info p {
            font-size: 18px;
            margin: 10px 0;
            color: #475569;
            font-weight: 500;
          }
          
          .table-of-contents {
            background: #f8fafc;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            border-right: 6px solid #2563eb;
            page-break-after: always;
          }
          
          .table-of-contents h2 {
            color: #1e40af;
            font-size: 32px;
            margin-bottom: 25px;
            text-align: center;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 15px;
          }
          
          .table-of-contents ul {
            list-style: none;
            padding: 0;
          }
          
          .table-of-contents li {
            margin: 15px 0;
            padding: 12px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          
          .table-of-contents li:hover {
            transform: translateX(-5px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .table-of-contents a {
            color: #374151;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            display: block;
          }
          
          .table-of-contents a:hover {
            color: #2563eb;
          }
          
          section {
            margin: 40px 0;
            page-break-inside: avoid;
          }
          
          section h2 {
            color: #1e40af;
            font-size: 28px;
            margin: 30px 0 20px 0;
            padding: 15px 0;
            border-bottom: 3px solid #e2e8f0;
            position: relative;
          }
          
          section h2::before {
            content: '';
            position: absolute;
            bottom: -3px;
            right: 0;
            width: 60px;
            height: 3px;
            background: #2563eb;
          }
          
          section h3 {
            color: #1f2937;
            font-size: 22px;
            margin: 25px 0 15px 0;
            font-weight: 600;
            background: linear-gradient(90deg, #f8fafc 0%, transparent 100%);
            padding: 10px 20px;
            border-right: 4px solid #60a5fa;
          }
          
          section h4 {
            color: #374151;
            font-size: 18px;
            margin: 20px 0 10px 0;
            font-weight: 600;
          }
          
          .module-section, .operation-section, .reports-section, .role-section {
            background: #f9fafb;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            border-right: 5px solid #10b981;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .interface-section {
            background: #fef3c7;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-right: 4px solid #f59e0b;
          }
          
          .flowchart-section {
            background: #ecfdf5;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            border-right: 5px solid #10b981;
            text-align: center;
          }
          
          .integration-section {
            background: #f0f9ff;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            border-right: 5px solid #0ea5e9;
          }
          
          .glossary-term {
            background: #faf5ff;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-right: 3px solid #8b5cf6;
          }
          
          .best-practice {
            background: #f0fdf4;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-right: 4px solid #22c55e;
            border-left: 4px solid #22c55e;
          }
          
          .warning-box {
            background: #fef2f2;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-right: 4px solid #ef4444;
            border-left: 4px solid #ef4444;
          }
          
          .info-box {
            background: #eff6ff;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-right: 4px solid #3b82f6;
            border-left: 4px solid #3b82f6;
          }
          
          ul, ol {
            padding-right: 25px;
            margin: 15px 0;
          }
          
          li {
            margin: 8px 0;
            line-height: 1.6;
          }
          
          ul li {
            list-style-type: none;
            position: relative;
            padding-right: 25px;
          }
          
          ul li::before {
            content: '▪';
            color: #2563eb;
            font-weight: bold;
            position: absolute;
            right: 0;
            font-size: 16px;
          }
          
          ol li {
            padding-right: 10px;
            font-weight: 500;
          }
          
          .steps ol li {
            background: #f8fafc;
            padding: 12px 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-right: 3px solid #60a5fa;
          }
          
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          
          .feature-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-top: 4px solid #2563eb;
          }
          
          .system-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .stat-card h4 {
            color: white;
            margin-bottom: 10px;
          }
          
          .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          th {
            background: #2563eb;
            color: white;
            padding: 15px 12px;
            text-align: right;
            font-weight: 600;
          }
          
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            background: #fafafa;
          }
          
          tr:nth-child(even) td {
            background: #f9fafb;
          }
          
          @media print {
            .guide-content {
              padding: 15px;
            }
            
            section {
              page-break-inside: avoid;
            }
            
            .cover-page, .table-of-contents {
              page-break-after: always;
            }
            
            h2, h3 {
              page-break-after: avoid;
            }
          }
        </style>
        
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل المستخدم الشامل</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>🇰🇼 مصمم خصيصاً لدولة الكويت</p>
              <p>📋 دليل موسوعي شامل</p>
              <p>🔧 الإصدار 2.0 المطور</p>
              <p>📅 ${new Date().getFullYear()}</p>
            </div>
          </div>

          <div class="table-of-contents">
            <h2>فهرس المحتويات</h2>
            <ul>
              <li><a href="#introduction">1. مقدمة النظام والمفاهيم الأساسية</a></li>
              <li><a href="#system-architecture">2. هيكل النظام والتقنيات المستخدمة</a></li>
              <li><a href="#user-roles">3. إدارة المستخدمين والصلاحيات</a></li>
              <li><a href="#interface-guide">4. دليل الواجهة والتنقل</a></li>
              <li><a href="#dashboard-module">5. وحدة لوحة التحكم الرئيسية</a></li>
              <li><a href="#contracts-module">6. وحدة إدارة العقود</a></li>
              <li><a href="#customers-module">7. وحدة إدارة العملاء</a></li>
              <li><a href="#fleet-module">8. وحدة إدارة الأسطول</a></li>
              <li><a href="#accounting-module">9. الوحدة المحاسبية</a></li>
              <li><a href="#invoicing-module">10. وحدة الفواتير والمدفوعات</a></li>
              <li><a href="#violations-module">11. وحدة المخالفات المرورية</a></li>
              <li><a href="#maintenance-module">12. وحدة الصيانة</a></li>
              <li><a href="#hr-module">13. وحدة الموارد البشرية</a></li>
              <li><a href="#reports-analytics">14. التقارير والتحليلات</a></li>
              <li><a href="#integrations">15. التكاملات والربط الخارجي</a></li>
              <li><a href="#security-backup">16. الأمان والنسخ الاحتياطي</a></li>
              <li><a href="#troubleshooting">17. استكشاف الأخطاء وحلها</a></li>
              <li><a href="#best-practices">18. أفضل الممارسات</a></li>
              <li><a href="#glossary">19. قاموس المصطلحات</a></li>
              <li><a href="#appendix">20. الملاحق والمراجع</a></li>
            </ul>
          </div>

          <section id="introduction">
            <h2>1. مقدمة النظام والمفاهيم الأساسية</h2>
            
            <h3>1.1 نظرة عامة على النظام</h3>
            <p>نظام إدارة تأجير المركبات هو حل تقني شامل ومتطور مصمم خصيصاً لدولة الكويت، يهدف إلى رقمنة وأتمتة جميع عمليات شركات تأجير المركبات. يتميز النظام بكونه حلاً متكاملاً يجمع بين سهولة الاستخدام والمرونة التشغيلية والدقة المحاسبية.</p>
            
            <div class="feature-grid">
              <div class="feature-card">
                <h4>💼 إدارة العقود</h4>
                <p>نظام متقدم لإدارة دورة حياة العقد كاملة من الإنشاء حتى الإكمال مع التوقيع الإلكتروني</p>
              </div>
              <div class="feature-card">
                <h4>📊 النظام المحاسبي</h4>
                <p>نظام محاسبي شامل وفق معايير المحاسبة الكويتية مع القيود التلقائية والتقارير المالية</p>
              </div>
              <div class="feature-card">
                <h4>🚗 إدارة الأسطول</h4>
                <p>إدارة شاملة للمركبات تشمل التسجيل، التأمين، الصيانة، والتتبع</p>
              </div>
              <div class="feature-card">
                <h4>👥 إدارة العملاء</h4>
                <p>قاعدة بيانات متقدمة للعملاء مع تاريخ التعاملات والتقييمات</p>
              </div>
              <div class="feature-card">
                <h4>🏢 الموارد البشرية</h4>
                <p>نظام كامل لإدارة الموظفين والحضور والرواتب</p>
              </div>
              <div class="feature-card">
                <h4>📈 التقارير والتحليلات</h4>
                <p>تقارير تفصيلية وتحليلات ذكية لدعم اتخاذ القرارات</p>
              </div>
            </div>

            <h3>1.2 إحصائيات النظام</h3>
            <div class="system-stats">
              <div class="stat-card">
                <h4>وحدات النظام</h4>
                <div class="stat-number">15+</div>
                <p>وحدة متكاملة</p>
              </div>
              <div class="stat-card">
                <h4>جداول البيانات</h4>
                <div class="stat-number">50+</div>
                <p>جدول بيانات</p>
              </div>
              <div class="stat-card">
                <h4>التقارير</h4>
                <div class="stat-number">25+</div>
                <p>تقرير مختلف</p>
              </div>
              <div class="stat-card">
                <h4>أدوار المستخدمين</h4>
                <div class="stat-number">5</div>
                <p>أدوار مختلفة</p>
              </div>
            </div>

            <h3>1.3 الميزات التقنية</h3>
            <div class="best-practice">
              <h4>🔧 التقنيات المستخدمة:</h4>
              <ul>
                <li><strong>واجهة المستخدم:</strong> React.js مع TypeScript للأمان والاستقرار</li>
                <li><strong>قاعدة البيانات:</strong> PostgreSQL مع Supabase للأداء العالي</li>
                <li><strong>التصميم:</strong> Tailwind CSS مع دعم RTL كامل</li>
                <li><strong>الأمان:</strong> Row Level Security (RLS) وتشفير البيانات</li>
                <li><strong>النسخ الاحتياطي:</strong> نسخ احتياطية تلقائية كل 24 ساعة</li>
                <li><strong>التحديثات:</strong> تحديثات مستمرة بدون انقطاع الخدمة</li>
              </ul>
            </div>

            <h3>1.4 فوائد النظام للشركة</h3>
            <div class="info-box">
              <h4>📈 العائد على الاستثمار:</h4>
              <ul>
                <li>تقليل الوقت المطلوب لمعالجة العقود بنسبة 75%</li>
                <li>تحسين دقة البيانات المالية بنسبة 99%</li>
                <li>تقليل الأخطاء البشرية بنسبة 85%</li>
                <li>زيادة الكفاءة التشغيلية بنسبة 60%</li>
                <li>توفير في التكاليف التشغيلية يصل إلى 40%</li>
              </ul>
            </div>
          </section>

          <section id="system-architecture">
            <h2>2. هيكل النظام والتقنيات المستخدمة</h2>
            
            <h3>2.1 البنية التقنية</h3>
            <div class="flowchart-section">
              <h4>🏗️ مخطط هيكل النظام</h4>
              <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
┌─────────────────────────────────────────────────────┐
│                 Frontend Layer                      │
│  React.js + TypeScript + Tailwind CSS + RTL        │
├─────────────────────────────────────────────────────┤
│                 Business Logic Layer                │
│  Services + Repositories + Event Handlers          │
├─────────────────────────────────────────────────────┤
│                 API Layer                          │
│  Supabase REST API + Real-time Subscriptions      │
├─────────────────────────────────────────────────────┤
│                 Database Layer                      │
│  PostgreSQL + Row Level Security + Triggers        │
├─────────────────────────────────────────────────────┤
│                 Infrastructure Layer                │
│  Supabase Cloud + CDN + Backup Systems            │
└─────────────────────────────────────────────────────┘
              </pre>
            </div>

            <h3>2.2 قاعدة البيانات</h3>
            <div class="module-section">
              <h4>📊 الجداول الرئيسية:</h4>
              <table>
                <thead>
                  <tr>
                    <th>اسم الجدول</th>
                    <th>الغرض</th>
                    <th>عدد الحقول</th>
                    <th>العلاقات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>contracts</td>
                    <td>العقود الأساسية</td>
                    <td>45+</td>
                    <td>customers, vehicles, quotations</td>
                  </tr>
                  <tr>
                    <td>customers</td>
                    <td>بيانات العملاء</td>
                    <td>25+</td>
                    <td>contracts, evaluations, violations</td>
                  </tr>
                  <tr>
                    <td>vehicles</td>
                    <td>بيانات المركبات</td>
                    <td>35+</td>
                    <td>contracts, maintenance, insurance</td>
                  </tr>
                  <tr>
                    <td>chart_of_accounts</td>
                    <td>دليل الحسابات</td>
                    <td>15+</td>
                    <td>journal_entries, budgets</td>
                  </tr>
                  <tr>
                    <td>employees</td>
                    <td>بيانات الموظفين</td>
                    <td>20+</td>
                    <td>attendance, payroll, departments</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.3 نظام الأمان</h3>
            <div class="warning-box">
              <h4>🔒 طبقات الحماية:</h4>
              <ul>
                <li><strong>Row Level Security (RLS):</strong> حماية على مستوى الصفوف في قاعدة البيانات</li>
                <li><strong>أدوار المستخدمين:</strong> نظام صلاحيات متدرج ومرن</li>
                <li><strong>تشفير البيانات:</strong> تشفير البيانات الحساسة</li>
                <li><strong>سجل المراجعة:</strong> تسجيل جميع العمليات الحساسة</li>
                <li><strong>النسخ الاحتياطية:</strong> نسخ احتياطية مشفرة ومجدولة</li>
              </ul>
            </div>
          </section>

          <section id="user-roles">
            <h2>3. إدارة المستخدمين والصلاحيات</h2>
            
            <h3>3.1 أدوار المستخدمين التفصيلية</h3>
            
            <div class="role-section">
              <h3>👑 المدير العام (Admin)</h3>
              <h4>الصلاحيات الكاملة:</h4>
              <ul>
                <li><strong>إدارة النظام:</strong> تكوين الإعدادات العامة، إدارة المستخدمين، النسخ الاحتياطي</li>
                <li><strong>العقود:</strong> إنشاء، تعديل، حذف، اعتماد جميع العقود</li>
                <li><strong>المحاسبة:</strong> عرض وتعديل جميع القيود والتقارير المالية</li>
                <li><strong>الموارد البشرية:</strong> إدارة الموظفين، الرواتب، الحضور</li>
                <li><strong>التقارير:</strong> الوصول لجميع التقارير والتحليلات</li>
                <li><strong>الصيانة:</strong> إدارة عمليات الصيانة والتكاليف</li>
              </ul>
              
              <h4>الواجهة المخصصة:</h4>
              <ul>
                <li>لوحة تحكم شاملة مع جميع المؤشرات الرئيسية</li>
                <li>تنبيهات فورية للعمليات المهمة</li>
                <li>إمكانية الوصول لجميع الوحدات</li>
                <li>أدوات التحليل المتقدمة</li>
              </ul>
            </div>

            <div class="role-section">
              <h3>📊 مدير الفرع (Manager)</h3>
              <h4>الصلاحيات المحدودة:</h4>
              <ul>
                <li><strong>العقود:</strong> إنشاء، تعديل، اعتماد العقود في نطاق الفرع</li>
                <li><strong>العملاء:</strong> إدارة قاعدة بيانات العملاء</li>
                <li><strong>الأسطول:</strong> متابعة حالة المركبات</li>
                <li><strong>التقارير:</strong> تقارير الفرع والمبيعات</li>
                <li><strong>الموظفين:</strong> إدارة موظفي الفرع</li>
              </ul>
            </div>

            <div class="role-section">
              <h3>💰 المحاسب (Accountant)</h3>
              <h4>الصلاحيات المحاسبية:</h4>
              <ul>
                <li><strong>دليل الحسابات:</strong> إنشاء وتعديل الحسابات</li>
                <li><strong>القيود المحاسبية:</strong> إدخال ومراجعة القيود</li>
                <li><strong>الفواتير:</strong> إنشاء ومتابعة الفواتير</li>
                <li><strong>المدفوعات:</strong> تسجيل وتتبع المدفوعات</li>
                <li><strong>التقارير المالية:</strong> إنشاء التقارير المالية</li>
                <li><strong>الميزانيات:</strong> إعداد ومتابعة الميزانيات</li>
              </ul>
            </div>

            <div class="role-section">
              <h3>🔧 الفني (Technician)</h3>
              <h4>صلاحيات الصيانة:</h4>
              <ul>
                <li><strong>الصيانة:</strong> تسجيل وإدارة عمليات الصيانة</li>
                <li><strong>الأسطول:</strong> تحديث حالة المركبات</li>
                <li><strong>التقارير:</strong> تقارير الصيانة والأعطال</li>
                <li><strong>قطع الغيار:</strong> إدارة مخزون قطع الغيار</li>
              </ul>
            </div>

            <div class="role-section">
              <h3>👤 موظف الاستقبال (Receptionist)</h3>
              <h4>الصلاحيات الأساسية:</h4>
              <ul>
                <li><strong>العقود:</strong> إنشاء عقود جديدة (تحتاج اعتماد)</li>
                <li><strong>العملاء:</strong> إضافة عملاء جدد وتحديث البيانات</li>
                <li><strong>المدفوعات:</strong> تسجيل المدفوعات الأساسية</li>
                <li><strong>التسليم والاستقبال:</strong> إجراءات تسليم واستقبال المركبات</li>
                <li><strong>التقارير:</strong> التقارير اليومية الأساسية</li>
              </ul>
            </div>

            <h3>3.2 إدارة الصلاحيات</h3>
            <div class="best-practice">
              <h4>💡 أفضل الممارسات في إدارة الصلاحيات:</h4>
              <ul>
                <li><strong>مبدأ الحد الأدنى:</strong> منح أقل الصلاحيات المطلوبة للعمل</li>
                <li><strong>المراجعة الدورية:</strong> مراجعة الصلاحيات كل 3 أشهر</li>
                <li><strong>الفصل بين المهام:</strong> عدم تركيز صلاحيات متضاربة في شخص واحد</li>
                <li><strong>التدوير الوظيفي:</strong> تدوير المهام الحساسة بين الموظفين</li>
                <li><strong>المراقبة المستمرة:</strong> مراقبة استخدام الصلاحيات عبر السجلات</li>
              </ul>
            </div>
          </section>

          <section id="interface-guide">
            <h2>4. دليل الواجهة والتنقل</h2>
            
            <h3>4.1 تخطيط الواجهة الرئيسية</h3>
            <div class="interface-section">
              <h4>🖥️ مكونات الواجهة:</h4>
              <ul>
                <li><strong>الشريط العلوي:</strong> يحتوي على الشعار، البحث، الإشعارات، ملف المستخدم</li>
                <li><strong>القائمة الجانبية:</strong> تضم جميع وحدات النظام مع إمكانية الطي/التوسيع</li>
                <li><strong>المحتوى الرئيسي:</strong> منطقة العمل الأساسية حسب الوحدة المختارة</li>
                <li><strong>شريط الحالة:</strong> يظهر معلومات الحالة والتنبيهات السريعة</li>
              </ul>
            </div>

            <h3>4.2 نظام التنقل</h3>
            <div class="module-section">
              <h4>🧭 طرق التنقل في النظام:</h4>
              <ul>
                <li><strong>القائمة الجانبية:</strong> التنقل الأساسي بين الوحدات</li>
                <li><strong>مسار التنقل (Breadcrumb):</strong> يظهر المسار الحالي</li>
                <li><strong>البحث الشامل:</strong> البحث في جميع البيانات عبر Ctrl+K</li>
                <li><strong>الاختصارات السريعة:</strong> مفاتيح الاختصار للعمليات الشائعة</li>
                <li><strong>التنقل بالتبويبات:</strong> فتح عدة صفحات في تبويبات منفصلة</li>
              </ul>
            </div>

            <h3>4.3 التخصيص والإعدادات</h3>
            <div class="best-practice">
              <h4>⚙️ خيارات التخصيص المتاحة:</h4>
              <ul>
                <li><strong>الثيم:</strong> الوضع الفاتح/الداكن حسب التفضيل</li>
                <li><strong>اللغة:</strong> دعم العربية والإنجليزية مع RTL كامل</li>
                <li><strong>العملة:</strong> الدينار الكويتي كعملة افتراضية</li>
                <li><strong>المنطقة الزمنية:</strong> توقيت الكويت (+3 GMT)</li>
                <li><strong>تخطيط الشاشة:</strong> تخصيص ترتيب العناصر</li>
                <li><strong>الإشعارات:</strong> إعدادات أنواع التنبيهات</li>
              </ul>
            </div>

            <h3>4.4 الاختصارات السريعة</h3>
            <div class="info-box">
              <h4>⌨️ مفاتيح الاختصار الأساسية:</h4>
              <table>
                <thead>
                  <tr>
                    <th>الاختصار</th>
                    <th>الوظيفة</th>
                    <th>السياق</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ctrl + K</td>
                    <td>البحث الشامل</td>
                    <td>في أي مكان</td>
                  </tr>
                  <tr>
                    <td>Ctrl + N</td>
                    <td>إنشاء جديد</td>
                    <td>في قوائم البيانات</td>
                  </tr>
                  <tr>
                    <td>Ctrl + S</td>
                    <td>حفظ</td>
                    <td>في النماذج</td>
                  </tr>
                  <tr>
                    <td>Ctrl + P</td>
                    <td>طباعة</td>
                    <td>في التقارير</td>
                  </tr>
                  <tr>
                    <td>F5</td>
                    <td>تحديث البيانات</td>
                    <td>في أي قائمة</td>
                  </tr>
                  <tr>
                    <td>Alt + D</td>
                    <td>فتح لوحة التحكم</td>
                    <td>من أي مكان</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="dashboard-module">
            <h2>5. وحدة لوحة التحكم الرئيسية</h2>
            
            <h3>5.1 المؤشرات الرئيسية</h3>
            <div class="module-section">
              <h4>📊 البطاقات الإحصائية:</h4>
              <ul>
                <li><strong>إجمالي العقود:</strong> العدد الكلي مع نسبة النمو الشهري</li>
                <li><strong>الإيرادات اليومية:</strong> إجمالي الإيرادات مع المقارنة بالأمس</li>
                <li><strong>المركبات المتاحة:</strong> عدد المركبات الجاهزة للتأجير</li>
                <li><strong>العقود النشطة:</strong> العقود الجارية حالياً</li>
                <li><strong>المركبات قيد الصيانة:</strong> المركبات غير المتاحة</li>
                <li><strong>المدفوعات المعلقة:</strong> المبالغ المستحقة التحصيل</li>
              </ul>
            </div>

            <h3>5.2 الرسوم البيانية والتحليلات</h3>
            <div class="flowchart-section">
              <h4>📈 أنواع التحليلات المتاحة:</h4>
              <ul>
                <li><strong>منحنى الإيرادات:</strong> تطور الإيرادات خلال آخر 12 شهر</li>
                <li><strong>توزيع أنواع المركبات:</strong> نسب استخدام أنواع المركبات</li>
                <li><strong>معدل إشغال الأسطول:</strong> كفاءة استخدام المركبات</li>
                <li><strong>أداء الموظفين:</strong> إحصائيات العقود لكل موظف</li>
                <li><strong>رضا العملاء:</strong> متوسط تقييمات العملاء</li>
                <li><strong>التنبؤات المالية:</strong> توقعات الإيرادات للشهر القادم</li>
              </ul>
            </div>

            <h3>5.3 التنبيهات والإشعارات</h3>
            <div class="warning-box">
              <h4>🔔 أنواع التنبيهات:</h4>
              <ul>
                <li><strong>عقود منتهية الصلاحية:</strong> تنبيه قبل انتهاء العقد بيوم</li>
                <li><strong>مركبات تحتاج صيانة:</strong> حسب المسافة المقطوعة أو الوقت</li>
                <li><strong>تأمينات منتهية:</strong> تنبيه قبل انتهاء التأمين بأسبوع</li>
                <li><strong>مدفوعات متأخرة:</strong> تنبيه للمبالغ المتأخرة</li>
                <li><strong>مخالفات جديدة:</strong> إشعار فوري بالمخالفات المرورية</li>
                <li><strong>مركبات غير مرخصة:</strong> تنبيه قبل انتهاء الترخيص</li>
              </ul>
            </div>

            <h3>5.4 المهام السريعة</h3>
            <div class="best-practice">
              <h4>⚡ العمليات السريعة من لوحة التحكم:</h4>
              <ul>
                <li><strong>إنشاء عقد جديد:</strong> بدء عقد جديد بخطوات مبسطة</li>
                <li><strong>تسجيل دفعة:</strong> تسجيل دفعة سريعة لعقد موجود</li>
                <li><strong>إضافة عميل:</strong> تسجيل عميل جديد في النظام</li>
                <li><strong>تسجيل صيانة:</strong> تسجيل عملية صيانة لمركبة</li>
                <li><strong>إنشاء فاتورة:</strong> إصدار فاتورة جديدة</li>
                <li><strong>تسجيل مخالفة:</strong> إدخال مخالفة مرورية جديدة</li>
              </ul>
            </div>
          </section>

          <section id="contracts-module">
            <h2>6. وحدة إدارة العقود (تفصيلية)</h2>
            
            <h3>6.1 مراحل دورة حياة العقد</h3>
            <div class="flowchart-section">
              <h4>🔄 سير العمل الكامل للعقد:</h4>
              <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
المسودة → المعلقة → المعتمدة → النشطة → قيد التنفيذ → مكتملة
   ↓         ↓         ↓         ↓         ↓           ↓
تحرير    اعتماد     دفعة      تسليم     متابعة      إغلاق
         أو رفض                المركبة               العقد
              </pre>
            </div>

            <h3>6.2 إنشاء العقد - دليل شامل</h3>
            <div class="operation-section">
              <h4>الخطوة 1: اختيار العميل</h4>
              <div class="steps">
                <ol>
                  <li><strong>البحث عن العميل:</strong> استخدم رقم الهوية، الاسم، أو رقم الهاتف</li>
                  <li><strong>التحقق من البيانات:</strong> تأكد من صحة بيانات العميل المسجلة</li>
                  <li><strong>إضافة عميل جديد:</strong> إذا لم يكن مسجلاً، أضف بياناته الكاملة</li>
                  <li><strong>التحقق من التاريخ:</strong> راجع تاريخ التعاملات السابقة والتقييم</li>
                  <li><strong>التحقق من القائمة السوداء:</strong> تأكد من عدم وجود العميل في القائمة السوداء</li>
                </ol>
              </div>

              <h4>الخطوة 2: اختيار المركبة</h4>
              <div class="steps">
                <ol>
                  <li><strong>تحديد المعايير:</strong> نوع المركبة، عدد المقاعد، الفئة السعرية</li>
                  <li><strong>فحص التوفر:</strong> تحقق من توفر المركبة في الفترة المطلوبة</li>
                  <li><strong>مراجعة الحالة:</strong> تأكد من حالة المركبة وصلاحياتها</li>
                  <li><strong>التحقق من التأمين:</strong> تأكد من سريان وثيقة التأمين</li>
                  <li><strong>مراجعة الصيانة:</strong> تحقق من تواريخ الصيانة القادمة</li>
                </ol>
              </div>

              <h4>الخطوة 3: تحديد فترة التأجير</h4>
              <div class="steps">
                <ol>
                  <li><strong>تاريخ البداية:</strong> يجب أن يكون اليوم أو تاريخ مستقبلي</li>
                  <li><strong>تاريخ النهاية:</strong> مع مراعاة الحد الأقصى للتأجير</li>
                  <li><strong>التحقق من التعارض:</strong> تأكد من عدم تعارض مع حجوزات أخرى</li>
                  <li><strong>العطل والإجازات:</strong> مراعاة العطل الرسمية في الحساب</li>
                  <li><strong>المرونة في التمديد:</strong> إمكانية تمديد العقد لاحقاً</li>
                </ol>
              </div>
            </div>

            <h3>6.3 التسعير المتقدم</h3>
            <div class="module-section">
              <h4>💰 نظام التسعير الديناميكي:</h4>
              <ul>
                <li><strong>السعر الأساسي:</strong> يختلف حسب نوع المركبة وموسم الطلب</li>
                <li><strong>خصومات الكمية:</strong> خصومات تلقائية للفترات الطويلة</li>
                <li><strong>خصومات العملاء المميزين:</strong> حسب تاريخ التعامل</li>
                <li><strong>الرسوم الإضافية:</strong> التأمين، التوصيل، السائق</li>
                <li><strong>ضريبة القيمة المضافة:</strong> حساب تلقائي حسب النسبة الحالية</li>
                <li><strong>مبلغ الضمان:</strong> قابل للتخصيص حسب نوع المركبة</li>
              </ul>
            </div>

            <h3>6.4 إجراءات التسليم والاستقبال</h3>
            <div class="best-practice">
              <h4>📝 قائمة فحص التسليم:</h4>
              <ul>
                <li><strong>الفحص الخارجي:</strong> التقاط صور من 8 زوايا مختلفة</li>
                <li><strong>الفحص الداخلي:</strong> حالة المقاعد، الأجهزة، النظافة</li>
                <li><strong>المحرك والميكانيك:</strong> فحص الزيت، الإطارات، الفرامل</li>
                <li><strong>الوثائق:</strong> رخصة السير، التأمين، دليل الاستخدام</li>
                <li><strong>الوقود:</strong> تسجيل مستوى الوقود بدقة</li>
                <li><strong>المسافة المقطوعة:</strong> قراءة العداد وتسجيلها</li>
                <li><strong>الملحقات:</strong> تأكيد وجود جميع الملحقات</li>
              </ul>
            </div>

            <h3>6.5 إدارة التمديدات والتعديلات</h3>
            <div class="info-box">
              <h4>🔄 إجراءات التمديد:</h4>
              <ul>
                <li><strong>طلب التمديد:</strong> يمكن للعميل طلب التمديد قبل انتهاء العقد</li>
                <li><strong>فحص التوفر:</strong> التأكد من توفر المركبة للفترة الإضافية</li>
                <li><strong>إعادة التسعير:</strong> حساب التكلفة الإضافية</li>
                <li><strong>اعتماد التمديد:</strong> يحتاج موافقة المدير للتمديدات الطويلة</li>
                <li><strong>تحديث العقد:</strong> تعديل تواريخ العقد وإعادة إرسال النسخة</li>
              </ul>
            </div>
          </section>

          <section id="customers-module">
            <h2>7. وحدة إدارة العملاء</h2>
            
            <h3>7.1 إدارة بيانات العملاء</h3>
            <div class="module-section">
              <h4>📝 البيانات الأساسية المطلوبة:</h4>
              <ul>
                <li><strong>البيانات الشخصية:</strong> الاسم الكامل (عربي/إنجليزي)، تاريخ الميلاد</li>
                <li><strong>الهوية:</strong> رقم البطاقة المدنية، جنسية، صورة الهوية</li>
                <li><strong>الاتصال:</strong> أرقام الهواتف، البريد الإلكتروني، العنوان</li>
                <li><strong>القيادة:</strong> رقم رخصة القيادة، تاريخ الإصدار والانتهاء</li>
                <li><strong>العمل:</strong> جهة العمل، المنصب، راتب للتحقق الائتماني</li>
                <li><strong>الطوارئ:</strong> جهة اتصال في حالات الطوارئ</li>
              </ul>
            </div>

            <h3>7.2 نظام تقييم العملاء</h3>
            <div class="best-practice">
              <h4>⭐ معايير التقييم:</h4>
              <ul>
                <li><strong>الالتزام بالدفع (40%):</strong> دفع المستحقات في المواعيد</li>
                <li><strong>العناية بالمركبة (30%):</strong> حالة المركبة عند الإرجاع</li>
                <li><strong>الالتزام بالمواعيد (20%):</strong> إرجاع المركبة في الوقت المحدد</li>
                <li><strong>التعاون (10%):</strong> سهولة التعامل والتواصل</li>
              </ul>
              
              <p><strong>نظام النقاط:</strong> من 1-5 نجوم، مع تحديث تلقائي بعد كل عقد</p>
            </div>

            <h3>7.3 تاريخ التعاملات</h3>
            <div class="info-box">
              <h4>📊 المعلومات المتاحة:</h4>
              <ul>
                <li><strong>العقود السابقة:</strong> جميع العقود مع التفاصيل والحالة</li>
                <li><strong>المدفوعات:</strong> تاريخ جميع المدفوعات والمتأخرات</li>
                <li><strong>المخالفات:</strong> سجل المخالفات المرورية</li>
                <li><strong>الحوادث:</strong> أي حوادث أو مشاكل حدثت</li>
                <li><strong>الشكاوي:</strong> شكاوي العميل وطريقة حلها</li>
                <li><strong>التقييمات:</strong> تقييمات العميل للخدمة</li>
              </ul>
            </div>

            <h3>7.4 إدارة القائمة السوداء</h3>
            <div class="warning-box">
              <h4>🚫 معايير إدراج العملاء في القائمة السوداء:</h4>
              <ul>
                <li><strong>تأخر الدفع:</strong> عدم دفع المستحقات لأكثر من 30 يوم</li>
                <li><strong>إتلاف المركبات:</strong> إلحاق أضرار جسيمة بالمركبة</li>
                <li><strong>انتهاك العقد:</strong> استخدام المركبة خارج الغرض المتفق عليه</li>
                <li><strong>سلوك غير لائق:</strong> سوء التعامل مع الموظفين</li>
                <li><strong>معلومات مضللة:</strong> تقديم بيانات غير صحيحة</li>
              </ul>
              
              <p><strong>إجراءات الرفع من القائمة:</strong> يتطلب موافقة المدير العام وتسوية جميع المستحقات</p>
            </div>
          </section>

          <section id="fleet-module">
            <h2>8. وحدة إدارة الأسطول</h2>
            
            <h3>8.1 تسجيل المركبات</h3>
            <div class="module-section">
              <h4>🚗 البيانات الأساسية للمركبة:</h4>
              <ul>
                <li><strong>المعلومات الأساسية:</strong> الماركة، الموديل، السنة، اللون</li>
                <li><strong>التسجيل:</strong> رقم اللوحة، رقم الشاسيه، رقم المحرك</li>
                <li><strong>المواصفات:</strong> نوع الوقود، عدد المقاعد، ناقل الحركة</li>
                <li><strong>التأمين:</strong> رقم البوليصة، شركة التأمين، تواريخ السريان</li>
                <li><strong>التسعير:</strong> السعر اليومي، الأسبوعي، الشهري</li>
                <li><strong>الصور:</strong> صور المركبة من جميع الزوايا</li>
              </ul>
            </div>

            <h3>8.2 إدارة الصيانة</h3>
            <div class="best-practice">
              <h4>🔧 نظام الصيانة الوقائية:</h4>
              <ul>
                <li><strong>الصيانة الدورية:</strong> كل 5000 كم أو 3 أشهر</li>
                <li><strong>فحص شامل:</strong> كل 10000 كم أو 6 أشهر</li>
                <li><strong>تغيير الإطارات:</strong> حسب نسبة التآكل</li>
                <li><strong>فحص الفرامل:</strong> كل 15000 كم</li>
                <li><strong>تجديد الترخيص:</strong> تذكير قبل شهر من الانتهاء</li>
                <li><strong>فحص الأمان:</strong> فحص سنوي للسلامة</li>
              </ul>
            </div>

            <h3>8.3 إدارة التأمين</h3>
            <div class="info-box">
              <h4>🛡️ أنواع التأمين المدعومة:</h4>
              <ul>
                <li><strong>التأمين الإجباري:</strong> تأمين ضد الغير (مطلوب قانونياً)</li>
                <li><strong>التأمين الشامل:</strong> تغطية شاملة للمركبة</li>
                <li><strong>تأمين ضد السرقة:</strong> تأمين إضافي ضد السرقة</li>
                <li><strong>تأمين الحوادث الشخصية:</strong> للسائق والركاب</li>
                <li><strong>المساعدة على الطريق:</strong> خدمة 24 ساعة</li>
              </ul>
            </div>

            <h3>8.4 تتبع الأداء والاستخدام</h3>
            <div class="flowchart-section">
              <h4>📈 مؤشرات الأداء:</h4>
              <ul>
                <li><strong>معدل الإشغال:</strong> نسبة الأيام المؤجرة من إجمالي الأيام</li>
                <li><strong>الإيراد لكل مركبة:</strong> متوسط الإيراد الشهري</li>
                <li><strong>تكلفة الصيانة:</strong> التكاليف مقارنة بالإيرادات</li>
                <li><strong>رضا العملاء:</strong> تقييمات العملاء لكل مركبة</li>
                <li><strong>معدل الأعطال:</strong> تكرار الأعطال والمشاكل</li>
                <li><strong>استهلاك الوقود:</strong> معدل الاستهلاك ومراقبة الكفاءة</li>
              </ul>
            </div>
          </section>

          <section id="accounting-module">
            <h2>9. الوحدة المحاسبية (شاملة)</h2>
            
            <h3>9.1 دليل الحسابات المفصل</h3>
            <div class="module-section">
              <h4>📊 التصنيف الهرمي للحسابات:</h4>
              
              <h5>الأصول (1000-1999):</h5>
              <ul>
                <li><strong>الأصول المتداولة (1100-1199):</strong>
                  <ul>
                    <li>1110: صندوق النقدية</li>
                    <li>1120: البنوك</li>
                    <li>1130: المدينون (العملاء)</li>
                    <li>1140: المخالفات المرورية المدينة</li>
                    <li>1150: المصروفات المدفوعة مقدماً</li>
                  </ul>
                </li>
                <li><strong>الأصول الثابتة (1300-1399):</strong>
                  <ul>
                    <li>1310: المركبات (بالتكلفة)</li>
                    <li>1320: مجمع استهلاك المركبات</li>
                    <li>1330: الأثاث والمعدات</li>
                    <li>1340: الأجهزة والحاسوب</li>
                  </ul>
                </li>
              </ul>
              
              <h5>الخصوم (2000-2999):</h5>
              <ul>
                <li><strong>الخصوم المتداولة (2100-2199):</strong>
                  <ul>
                    <li>2110: الرواتب والأجور المستحقة</li>
                    <li>2120: الضرائب المستحقة</li>
                    <li>2130: التأمينات المستحقة</li>
                    <li>2140: أمانات العملاء</li>
                    <li>2150: الدائنون (الموردون)</li>
                  </ul>
                </li>
              </ul>
              
              <h5>الإيرادات (4000-4999):</h5>
              <ul>
                <li>4110: إيرادات تأجير المركبات</li>
                <li>4120: إيرادات الخدمات الإضافية</li>
                <li>4130: إيرادات التأمين</li>
                <li>4140: إيرادات الضمانات المصادرة</li>
                <li>4150: إيرادات المخالفات المرورية</li>
              </ul>
            </div>

            <h3>9.2 القيود المحاسبية التلقائية</h3>
            <div class="best-practice">
              <h4>⚡ القيود التلقائية المدعومة:</h4>
              
              <h5>عند إنشاء عقد:</h5>
              <div class="steps">
                <pre>من حـ/ المدينون (العملاء)          XXX د.ك
    إلى حـ/ إيرادات التأجير              XXX د.ك
    إلى حـ/ أمانات العملاء              XXX د.ك</pre>
              </div>
              
              <h5>عند تحصيل دفعة:</h5>
              <div class="steps">
                <pre>من حـ/ صندوق النقدية/البنك         XXX د.ك
    إلى حـ/ المدينون (العملاء)         XXX د.ك</pre>
              </div>
              
              <h5>عند تسجيل مخالفة:</h5>
              <div class="steps">
                <pre>من حـ/ المخالفات المرورية المدينة   XXX د.ك
    إلى حـ/ إيرادات المخالفات           XXX د.ك</pre>
              </div>
            </div>

            <h3>9.3 التقارير المالية</h3>
            <div class="flowchart-section">
              <h4>📋 التقارير المالية الأساسية:</h4>
              <ul>
                <li><strong>الميزانية العمومية:</strong> تقرير المركز المالي في تاريخ محدد</li>
                <li><strong>قائمة الدخل:</strong> الإيرادات والمصروفات لفترة محددة</li>
                <li><strong>قائمة التدفقات النقدية:</strong> حركة النقدية الداخلة والخارجة</li>
                <li><strong>قائمة التغيرات في حقوق الملكية:</strong> تطور رأس المال</li>
                <li><strong>كشف المدينين:</strong> أرصدة العملاء المدينة</li>
                <li><strong>كشف الدائنين:</strong> المبالغ المستحقة للموردين</li>
              </ul>
            </div>

            <h3>9.4 نظام الميزانيات والتخطيط</h3>
            <div class="info-box">
              <h4>💼 إدارة الميزانيات:</h4>
              <ul>
                <li><strong>الميزانية السنوية:</strong> تخطيط الإيرادات والمصروفات</li>
                <li><strong>مراكز التكلفة:</strong> توزيع التكاليف على الأقسام</li>
                <li><strong>تحليل الانحرافات:</strong> مقارنة الفعلي بالمخطط</li>
                <li><strong>التنبؤات المالية:</strong> توقعات الأداء المستقبلي</li>
                <li><strong>تقارير الربحية:</strong> تحليل ربحية كل خط أعمال</li>
              </ul>
            </div>
          </section>

          <section id="invoicing-module">
            <h2>10. وحدة الفواتير والمدفوعات</h2>
            
            <h3>10.1 إنشاء الفواتير</h3>
            <div class="operation-section">
              <h4>📄 أنواع الفواتير:</h4>
              <ul>
                <li><strong>فاتورة العقد الأساسية:</strong> تنشأ تلقائياً مع العقد</li>
                <li><strong>فواتير إضافية:</strong> لخدمات أو رسوم إضافية</li>
                <li><strong>فواتير المخالفات:</strong> للمخالفات المرورية</li>
                <li><strong>فواتير الأضرار:</strong> لتكلفة الإصلاحات</li>
                <li><strong>فواتير الضمان:</strong> لاستقطاع من مبلغ الضمان</li>
              </ul>
            </div>

            <h3>10.2 إدارة المدفوعات</h3>
            <div class="module-section">
              <h4>💳 طرق الدفع المدعومة:</h4>
              <ul>
                <li><strong>النقد:</strong> الدفع النقدي مع إصدار إيصال</li>
                <li><strong>بطاقة الائتمان:</strong> فيزا، ماستركارد، أمريكان إكسبريس</li>
                <li><strong>بطاقة الخصم:</strong> البطاقات البنكية المحلية</li>
                <li><strong>التحويل البنكي:</strong> التحويل المباشر للحساب</li>
                <li><strong>شيك بنكي:</strong> مع التحقق من صحة الشيك</li>
                <li><strong>الدفع الإلكتروني:</strong> كي نت وطرق الدفع الرقمية</li>
              </ul>
            </div>

            <h3>10.3 متابعة المتأخرات</h3>
            <div class="warning-box">
              <h4>⏰ نظام متابعة المدفوعات المتأخرة:</h4>
              <ul>
                <li><strong>التنبيه الأول:</strong> قبل تاريخ الاستحقاق بـ 3 أيام</li>
                <li><strong>التنبيه الثاني:</strong> في تاريخ الاستحقاق</li>
                <li><strong>التنبيه الثالث:</strong> بعد التأخير بـ 7 أيام</li>
                <li><strong>الإجراء القانوني:</strong> بعد التأخير بـ 30 يوم</li>
                <li><strong>حظر التعامل:</strong> إدراج في القائمة السوداء</li>
              </ul>
            </div>

            <h3>10.4 تقارير المدفوعات</h3>
            <div class="flowchart-section">
              <h4>📊 تقارير المدفوعات المتاحة:</h4>
              <ul>
                <li><strong>تقرير المدفوعات اليومية:</strong> جميع المدفوعات خلال اليوم</li>
                <li><strong>تقرير المتأخرات:</strong> المبالغ المتأخرة مع تفاصيل العملاء</li>
                <li><strong>تقرير طرق الدفع:</strong> توزيع المدفوعات حسب الطريقة</li>
                <li><strong>تقرير التحصيل:</strong> معدلات التحصيل وكفاءة المتابعة</li>
                <li><strong>تحليل التدفق النقدي:</strong> توقعات المدفوعات القادمة</li>
              </ul>
            </div>
          </section>

          <section id="violations-module">
            <h2>11. وحدة المخالفات المرورية</h2>
            
            <h3>11.1 تسجيل المخالفات</h3>
            <div class="module-section">
              <h4>🚦 إجراءات تسجيل المخالفة:</h4>
              <div class="steps">
                <ol>
                  <li><strong>استلام إشعار المخالفة:</strong> من الجهات المختصة</li>
                  <li><strong>التحقق من البيانات:</strong> التأكد من رقم اللوحة والتاريخ</li>
                  <li><strong>ربط بالعقد:</strong> تحديد العقد النشط في تاريخ المخالفة</li>
                  <li><strong>إدخال تفاصيل المخالفة:</strong> النوع، المبلغ، المكان</li>
                  <li><strong>إشعار العميل:</strong> إرسال إشعار فوري للعميل</li>
                  <li><strong>إنشاء القيد المحاسبي:</strong> تسجيل المبلغ كمدين على العميل</li>
                </ol>
              </div>
            </div>

            <h3>11.2 أنواع المخالفات</h3>
            <div class="info-box">
              <h4>⚠️ تصنيفات المخالفات المدعومة:</h4>
              <ul>
                <li><strong>مخالفات السرعة:</strong> تجاوز الحد المسموح</li>
                <li><strong>مخالفات الإشارة:</strong> عدم التوقف أو تجاهل الإشارة</li>
                <li><strong>مخالفات الوقوف:</strong> الوقوف في أماكن ممنوعة</li>
                <li><strong>مخالفات التجاوز:</strong> التجاوز الخاطئ</li>
                <li><strong>مخالفات الهاتف:</strong> استخدام الهاتف أثناء القيادة</li>
                <li><strong>مخالفات السلامة:</strong> عدم ربط الحزام أو الخوذة</li>
              </ul>
            </div>

            <h3>11.3 متابعة الدفع</h3>
            <div class="best-practice">
              <h4>💰 نظام متابعة دفع المخالفات:</h4>
              <ul>
                <li><strong>الإشعار الفوري:</strong> إشعار العميل خلال 24 ساعة</li>
                <li><strong>فترة السماح:</strong> 7 أيام للدفع بدون غرامات إضافية</li>
                <li><strong>الغرامة الإضافية:</strong> 10% زيادة كل أسبوع تأخير</li>
                <li><strong>التحصيل القانوني:</strong> بعد 30 يوم من تاريخ المخالفة</li>
                <li><strong>حجز الضمان:</strong> خصم من مبلغ الضمان إذا لزم الأمر</li>
              </ul>
            </div>

            <h3>11.4 التقارير والإحصائيات</h3>
            <div class="flowchart-section">
              <h4>📈 تحليلات المخالفات:</h4>
              <ul>
                <li><strong>الإحصائيات الشهرية:</strong> عدد ونوع المخالفات</li>
                <li><strong>تحليل العملاء:</strong> العملاء الأكثر مخالفة</li>
                <li><strong>تحليل المركبات:</strong> المركبات الأكثر تعرضاً للمخالفات</li>
                <li><strong>التحليل الجغرافي:</strong> المناطق الأكثر حدوثاً للمخالفات</li>
                <li><strong>تقرير التحصيل:</strong> معدلات تحصيل غرامات المخالفات</li>
              </ul>
            </div>
          </section>

          <section id="maintenance-module">
            <h2>12. وحدة الصيانة</h2>
            
            <h3>12.1 نظام الصيانة الوقائية</h3>
            <div class="best-practice">
              <h4>🔧 جدولة الصيانة الذكية:</h4>
              <ul>
                <li><strong>الصيانة حسب المسافة:</strong> كل 5000، 10000، 15000 كم</li>
                <li><strong>الصيانة الزمنية:</strong> كل 3، 6، 12 شهر</li>
                <li><strong>الصيانة الطارئة:</strong> عند حدوث عطل مفاجئ</li>
                <li><strong>الصيانة الموسمية:</strong> تحضير للصيف/الشتاء</li>
                <li><strong>الفحص الدوري:</strong> فحص شامل سنوي</li>
                <li><strong>صيانة ما قبل التأجير:</strong> فحص قبل كل عقد جديد</li>
              </ul>
            </div>

            <h3>12.2 إدارة ورش الصيانة</h3>
            <div class="module-section">
              <h4>🏪 بيانات ورش الصيانة:</h4>
              <ul>
                <li><strong>معلومات الورشة:</strong> الاسم، العنوان، التخصص</li>
                <li><strong>بيانات الاتصال:</strong> الهاتف، المسؤول، ساعات العمل</li>
                <li><strong>التقييم:</strong> تقييم جودة العمل والأسعار</li>
                <li><strong>التخصصات:</strong> أنواع الصيانة المتاحة</li>
                <li><strong>العقود:</strong> اتفاقيات الأسعار والضمانات</li>
                <li><strong>المواعيد:</strong> جدولة المواعيد والمتابعة</li>
              </ul>
            </div>

            <h3>12.3 إدارة قطع الغيار</h3>
            <div class="info-box">
              <h4>📦 نظام مخزون قطع الغيار:</h4>
              <ul>
                <li><strong>كتالوج قطع الغيار:</strong> قاعدة بيانات شاملة للقطع</li>
                <li><strong>إدارة المخزون:</strong> مستويات المخزون والحد الأدنى</li>
                <li><strong>الموردين:</strong> قاعدة بيانات الموردين والأسعار</li>
                <li><strong>طلبيات الشراء:</strong> نظام آلي لطلب القطع</li>
                <li><strong>التكلفة:</strong> تتبع تكلفة قطع الغيار لكل مركبة</li>
                <li><strong>الضمانات:</strong> متابعة ضمانات قطع الغيار</li>
              </ul>
            </div>

            <h3>12.4 تقارير الصيانة</h3>
            <div class="flowchart-section">
              <h4>📊 تحليلات الصيانة:</h4>
              <ul>
                <li><strong>تكلفة الصيانة لكل مركبة:</strong> مقارنة التكاليف</li>
                <li><strong>تحليل الأعطال:</strong> الأعطال الأكثر شيوعاً</li>
                <li><strong>أداء الورش:</strong> تقييم جودة وسرعة العمل</li>
                <li><strong>التكلفة مقابل العمر:</strong> تحليل جدوى الاحتفاظ بالمركبة</li>
                <li><strong>الصيانة الوقائية:</strong> فعالية برامج الصيانة الوقائية</li>
                <li><strong>توقعات الصيانة:</strong> التنبؤ بالحاجة للصيانة</li>
              </ul>
            </div>
          </section>

          <section id="hr-module">
            <h2>13. وحدة الموارد البشرية</h2>
            
            <h3>13.1 إدارة الموظفين</h3>
            <div class="module-section">
              <h4>👥 ملف الموظف الشامل:</h4>
              <ul>
                <li><strong>البيانات الشخصية:</strong> الاسم، الهوية، تاريخ الميلاد</li>
                <li><strong>المعلومات الوظيفية:</strong> المنصب، القسم، تاريخ التعيين</li>
                <li><strong>الراتب والبدلات:</strong> الراتب الأساسي، البدلات، الحوافز</li>
                <li><strong>الإجازات:</strong> رصيد الإجازات، الإجازات المستخدمة</li>
                <li><strong>التقييمات:</strong> تقييمات الأداء السنوية</li>
                <li><strong>التدريب:</strong> الدورات والشهادات الحاصل عليها</li>
              </ul>
            </div>

            <h3>13.2 نظام الحضور والانصراف</h3>
            <div class="best-practice">
              <h4>⏰ نظام تسجيل الحضور:</h4>
              <ul>
                <li><strong>البصمة الذكية:</strong> تسجيل الحضور بالبصمة</li>
                <li><strong>تحديد الموقع:</strong> التأكد من الحضور من مكان العمل</li>
                <li><strong>ساعات العمل المرنة:</strong> دعم نظام الدوام المرن</li>
                <li><strong>العمل الإضافي:</strong> حساب ساعات العمل الإضافي</li>
                <li><strong>الغياب والتأخير:</strong> تسجيل حالات الغياب والتأخير</li>
                <li><strong>الاستئذان:</strong> نظام طلب الاستئذان الإلكتروني</li>
              </ul>
            </div>

            <h3>13.3 إدارة الرواتب</h3>
            <div class="info-box">
              <h4>💰 نظام الرواتب المتقدم:</h4>
              <ul>
                <li><strong>حساب الراتب:</strong> راتب أساسي + بدلات + حوافز</li>
                <li><strong>الخصومات:</strong> التأمينات، الضرائب، السلف</li>
                <li><strong>تعويض العمل الإضافي:</strong> حساب ساعات إضافية</li>
                <li><strong>المكافآت:</strong> مكافآت الأداء والمناسبات</li>
                <li><strong>تعويض نهاية الخدمة:</strong> حساب مكافأة نهاية الخدمة</li>
                <li><strong>كشف الراتب:</strong> كشف راتب مفصل لكل موظف</li>
              </ul>
            </div>

            <h3>13.4 إدارة الإجازات</h3>
            <div class="operation-section">
              <h4>🏖️ أنواع الإجازات المدعومة:</h4>
              <ul>
                <li><strong>الإجازة السنوية:</strong> 30 يوم في السنة</li>
                <li><strong>الإجازة المرضية:</strong> بتقرير طبي</li>
                <li><strong>إجازة الوضع:</strong> للموظفات (3 أشهر)</li>
                <li><strong>إجازة الوفاة:</strong> 3 أيام للأقارب من الدرجة الأولى</li>
                <li><strong>إجازة الزواج:</strong> 7 أيام للذكور، 15 يوم للإناث</li>
                <li><strong>إجازة بدون راتب:</strong> حسب ظروف العمل</li>
              </ul>
            </div>
          </section>

          <section id="reports-analytics">
            <h2>14. التقارير والتحليلات</h2>
            
            <h3>14.1 تقارير المبيعات والإيرادات</h3>
            <div class="flowchart-section">
              <h4>📈 تقارير الأداء المالي:</h4>
              <ul>
                <li><strong>تقرير المبيعات اليومية:</strong> العقود والإيرادات اليومية</li>
                <li><strong>تقرير الإيرادات الشهرية:</strong> مقارنة بالشهر السابق</li>
                <li><strong>تحليل الربحية:</strong> هامش الربح لكل خط أعمال</li>
                <li><strong>تقرير العملاء الرئيسيين:</strong> أهم العملاء حسب الإيراد</li>
                <li><strong>تحليل الموسمية:</strong> تقلبات الطلب خلال السنة</li>
                <li><strong>توقعات الإيرادات:</strong> نمذجة الإيرادات المستقبلية</li>
              </ul>
            </div>

            <h3>14.2 تقارير الأسطول والاستخدام</h3>
            <div class="module-section">
              <h4>🚗 تحليلات الأسطول:</h4>
              <ul>
                <li><strong>معدل إشغال الأسطول:</strong> نسبة الاستخدام لكل مركبة</li>
                <li><strong>تحليل الربحية:</strong> الإيراد مقابل التكلفة لكل مركبة</li>
                <li><strong>تقرير الصيانة:</strong> تكاليف وجدولة الصيانة</li>
                <li><strong>تحليل الاستهلاك:</strong> استهلاك الوقود والإطارات</li>
                <li><strong>تقييم الأداء:</strong> أداء كل مركبة مقارنة بالمعايير</li>
                <li><strong>التخطيط للتجديد:</strong> توصيات لتجديد الأسطول</li>
              </ul>
            </div>

            <h3>14.3 تقارير العملاء والرضا</h3>
            <div class="best-practice">
              <h4>😊 تحليلات رضا العملاء:</h4>
              <ul>
                <li><strong>مؤشر رضا العملاء:</strong> متوسط التقييمات والآراء</li>
                <li><strong>تحليل الشكاوي:</strong> أنواع الشكاوي وطرق حلها</li>
                <li><strong>معدل العودة:</strong> نسبة العملاء العائدين</li>
                <li><strong>تحليل قيمة العميل:</strong> القيمة الدائمة لكل عميل</li>
                <li><strong>تجميع التعليقات:</strong> تحليل نصي للتعليقات</li>
                <li><strong>مقترحات التحسين:</strong> توصيات لتحسين الخدمة</li>
              </ul>
            </div>

            <h3>14.4 التحليلات المتقدمة والذكاء الاصطناعي</h3>
            <div class="info-box">
              <h4>🤖 التحليلات الذكية:</h4>
              <ul>
                <li><strong>التنبؤ بالطلب:</strong> توقع الطلب على أنواع المركبات</li>
                <li><strong>تحسين التسعير:</strong> اقتراح أسعار ديناميكية</li>
                <li><strong>كشف الاحتيال:</strong> رصد المعاملات المشبوهة</li>
                <li><strong>تحليل المخاطر:</strong> تقييم مخاطر العملاء</li>
                <li><strong>تحسين العمليات:</strong> اقتراحات لتحسين الكفاءة</li>
                <li><strong>التحليل التنافسي:</strong> مقارنة مع المنافسين</li>
              </ul>
            </div>
          </section>

          <section id="integrations">
            <h2>15. التكاملات والربط الخارجي</h2>
            
            <h3>15.1 التكامل مع الأنظمة الحكومية</h3>
            <div class="integration-section">
              <h4>🏛️ الربط مع الجهات الرسمية:</h4>
              <ul>
                <li><strong>الهيئة العامة للمعلومات المدنية:</strong> التحقق من بيانات الهوية</li>
                <li><strong>إدارة المرور:</strong> الاستعلام عن المخالفات والرخص</li>
                <li><strong>شركات التأمين:</strong> التحقق من صحة وثائق التأمين</li>
                <li><strong>البنك المركزي:</strong> التحقق من القوائم السوداء</li>
                <li><strong>الهيئة العامة للاستثمار:</strong> تحديث أسعار الصرف</li>
                <li><strong>وزارة المالية:</strong> الإقرارات الضريبية الإلكترونية</li>
              </ul>
            </div>

            <h3>15.2 التكامل مع الأنظمة المصرفية</h3>
            <div class="module-section">
              <h4>🏦 خدمات البنوك الإلكترونية:</h4>
              <ul>
                <li><strong>بوابات الدفع:</strong> كي نت، فيزا، ماستركارد</li>
                <li><strong>التحويلات البنكية:</strong> نظام التحويل السريع</li>
                <li><strong>كشوف الحساب:</strong> استيراد تلقائي لكشوف البنك</li>
                <li><strong>تسوية المدفوعات:</strong> مطابقة تلقائية للمدفوعات</li>
                <li><strong>إدارة المخاطر:</strong> فحص الجدارة الائتمانية</li>
                <li><strong>العملات الأجنبية:</strong> تحديث أسعار الصرف</li>
              </ul>
            </div>

            <h3>15.3 التكامل مع أنظمة المحاسبة</h3>
            <div class="best-practice">
              <h4>📊 الربط مع أنظمة ERP:</h4>
              <ul>
                <li><strong>تصدير البيانات:</strong> تصدير للأنظمة المحاسبية الخارجية</li>
                <li><strong>استيراد الميزانيات:</strong> استيراد الميزانيات من أنظمة أخرى</li>
                <li><strong>مزامنة دليل الحسابات:</strong> توحيد دليل الحسابات</li>
                <li><strong>تبادل القيود:</strong> تبادل القيود المحاسبية</li>
                <li><strong>التقارير الموحدة:</strong> دمج التقارير من عدة أنظمة</li>
                <li><strong>التدقيق المتبادل:</strong> مراجعة البيانات بين الأنظمة</li>
              </ul>
            </div>

            <h3>15.4 واجهات برمجة التطبيقات (APIs)</h3>
            <div class="info-box">
              <h4>🔌 APIs المتاحة:</h4>
              <ul>
                <li><strong>REST API:</strong> واجهة برمجية للعمليات الأساسية</li>
                <li><strong>GraphQL:</strong> استعلامات مرنة للبيانات</li>
                <li><strong>Webhooks:</strong> إشعارات فورية للأحداث المهمة</li>
                <li><strong>Real-time API:</strong> تحديثات فورية للبيانات</li>
                <li><strong>Bulk API:</strong> عمليات جماعية على البيانات</li>
                <li><strong>Analytics API:</strong> استخراج البيانات للتحليل</li>
              </ul>
            </div>
          </section>

          <section id="security-backup">
            <h2>16. الأمان والنسخ الاحتياطي</h2>
            
            <h3>16.1 نظام الأمان المتقدم</h3>
            <div class="warning-box">
              <h4>🔒 طبقات الحماية:</h4>
              <ul>
                <li><strong>تشفير البيانات:</strong> تشفير AES-256 لجميع البيانات الحساسة</li>
                <li><strong>المصادقة الثنائية:</strong> 2FA لجميع الحسابات الإدارية</li>
                <li><strong>أمان الشبكة:</strong> جدار حماية وفلترة متقدمة</li>
                <li><strong>مراقبة الأنشطة:</strong> تسجيل جميع العمليات الحساسة</li>
                <li><strong>إدارة الجلسات:</strong> انتهاء تلقائي للجلسات الخاملة</li>
                <li><strong>حماية من الهجمات:</strong> حماية من SQL Injection وXSS</li>
              </ul>
            </div>

            <h3>16.2 نظام النسخ الاحتياطي</h3>
            <div class="best-practice">
              <h4>💾 استراتيجية النسخ الاحتياطي:</h4>
              <ul>
                <li><strong>النسخ اليومية:</strong> نسخة احتياطية كاملة كل 24 ساعة</li>
                <li><strong>النسخ التزايدية:</strong> نسخ للتغييرات كل 4 ساعات</li>
                <li><strong>التخزين المتعدد:</strong> نسخ في مواقع جغرافية متعددة</li>
                <li><strong>التشفير:</strong> جميع النسخ مشفرة بمفاتيح قوية</li>
                <li><strong>اختبار الاستعادة:</strong> اختبار شهري لعملية الاستعادة</li>
                <li><strong>الاحتفاظ طويل المدى:</strong> نسخ سنوية لمدة 7 سنوات</li>
              </ul>
            </div>

            <h3>16.3 إدارة الوصول والصلاحيات</h3>
            <div class="module-section">
              <h4>👑 نظام إدارة الهويات:</h4>
              <ul>
                <li><strong>Single Sign-On (SSO):</strong> تسجيل دخول موحد</li>
                <li><strong>إدارة الأدوار:</strong> نظام أدوار متدرج ومرن</li>
                <li><strong>مراجعة الصلاحيات:</strong> مراجعة دورية كل 90 يوم</li>
                <li><strong>سجل الوصول:</strong> تسجيل جميع محاولات الوصول</li>
                <li><strong>قفل الحسابات:</strong> قفل تلقائي بعد محاولات فاشلة</li>
                <li><strong>كلمات مرور قوية:</strong> سياسة كلمات مرور معقدة</li>
              </ul>
            </div>

            <h3>16.4 خطة استمرارية الأعمال</h3>
            <div class="info-box">
              <h4>🚨 خطة الطوارئ:</h4>
              <ul>
                <li><strong>موقع احتياطي:</strong> موقع بديل للعمليات الحرجة</li>
                <li><strong>فريق الطوارئ:</strong> فريق مدرب للتعامل مع الأزمات</li>
                <li><strong>إجراءات الاستعادة:</strong> خطوات واضحة لاستعادة النظام</li>
                <li><strong>التواصل:</strong> خطة تواصل مع العملاء والموظفين</li>
                <li><strong>اختبار الخطة:</strong> اختبار ربع سنوي للخطة</li>
                <li><strong>التحديث المستمر:</strong> تحديث الخطة حسب التطورات</li>
              </ul>
            </div>
          </section>

          <section id="troubleshooting">
            <h2>17. استكشاف الأخطاء وحلها</h2>
            
            <h3>17.1 المشاكل الشائعة وحلولها</h3>
            <div class="warning-box">
              <h4>⚠️ مشاكل تسجيل الدخول:</h4>
              <ul>
                <li><strong>كلمة مرور خاطئة:</strong> التأكد من تفعيل Caps Lock وتجربة إعادة تعيين</li>
                <li><strong>حساب مقفل:</strong> التواصل مع المدير لإلغاء القفل</li>
                <li><strong>انتهاء الجلسة:</strong> تسجيل دخول جديد وحفظ العمل</li>
                <li><strong>مشاكل الاتصال:</strong> فحص الإنترنت وإعدادات الشبكة</li>
                <li><strong>مشاكل المتصفح:</strong> مسح الكاش وتحديث المتصفح</li>
              </ul>
            </div>

            <h3>17.2 مشاكل الأداء</h3>
            <div class="info-box">
              <h4>🐌 حلول بطء النظام:</h4>
              <ul>
                <li><strong>تحسين المتصفح:</strong> إغلاق التبويبات الزائدة ومسح الكاش</li>
                <li><strong>فحص الشبكة:</strong> قياس سرعة الإنترنت والاستقرار</li>
                <li><strong>تقليل البيانات:</strong> استخدام المرشحات لتقليل البيانات المحملة</li>
                <li><strong>وقت الذروة:</strong> تجنب العمليات الثقيلة في أوقات الذروة</li>
                <li><strong>تحديث النظام:</strong> التأكد من استخدام أحدث إصدار</li>
              </ul>
            </div>

            <h3>17.3 مشاكل البيانات</h3>
            <div class="best-practice">
              <h4>🔧 حل مشاكل البيانات:</h4>
              <ul>
                <li><strong>البيانات المفقودة:</strong> فحص النسخ الاحتياطية واستعادة البيانات</li>
                <li><strong>البيانات المكررة:</strong> استخدام أدوات إزالة التكرار</li>
                <li><strong>عدم تطابق البيانات:</strong> مراجعة وتصحيح البيانات يدوياً</li>
                <li><strong>أخطاء الحفظ:</strong> التحقق من الصلاحيات والمساحة المتاحة</li>
                <li><strong>مشاكل التزامن:</strong> تحديث الصفحة وإعادة المحاولة</li>
              </ul>
            </div>

            <h3>17.4 دعم المستخدمين</h3>
            <div class="module-section">
              <h4>📞 قنوات الدعم المتاحة:</h4>
              <ul>
                <li><strong>الدعم الفوري:</strong> دردشة مباشرة داخل النظام</li>
                <li><strong>البريد الإلكتروني:</strong> تذاكر الدعم عبر البريد</li>
                <li><strong>الهاتف:</strong> خط ساخن للدعم العاجل</li>
                <li><strong>قاعدة المعرفة:</strong> أسئلة شائعة وحلول</li>
                <li><strong>فيديوهات تعليمية:</strong> دروس مصورة للعمليات</li>
                <li><strong>التدريب الشخصي:</strong> جلسات تدريب فردية</li>
              </ul>
            </div>
          </section>

          <section id="best-practices">
            <h2>18. أفضل الممارسات</h2>
            
            <h3>18.1 أفضل ممارسات الأمان</h3>
            <div class="best-practice">
              <h4>🔐 ضمان أمان النظام:</h4>
              <ul>
                <li><strong>كلمات المرور:</strong> استخدام كلمات مرور قوية ومختلفة</li>
                <li><strong>تحديث منتظم:</strong> تغيير كلمات المرور كل 90 يوم</li>
                <li><strong>عدم المشاركة:</strong> عدم مشاركة بيانات الدخول</li>
                <li><strong>تسجيل الخروج:</strong> تسجيل خروج عند ترك المكتب</li>
                <li><strong>مراقبة النشاط:</strong> مراجعة سجل النشاط بانتظام</li>
                <li><strong>التبليغ الفوري:</strong> الإبلاغ عن أي نشاط مشبوه</li>
              </ul>
            </div>

            <h3>18.2 أفضل ممارسات إدخال البيانات</h3>
            <div class="info-box">
              <h4>📝 ضمان جودة البيانات:</h4>
              <ul>
                <li><strong>التحقق المزدوج:</strong> مراجعة البيانات قبل الحفظ</li>
                <li><strong>الاستخدام الصحيح:</strong> استخدام التنسيق المطلوب للتواريخ والأرقام</li>
                <li><strong>البيانات الكاملة:</strong> ملء جميع الحقول المطلوبة</li>
                <li><strong>الصور الواضحة:</strong> التقاط صور عالية الجودة</li>
                <li><strong>النسخ الاحتياطي:</strong> حفظ نسخ من الوثائق المهمة</li>
                <li><strong>التحديث الفوري:</strong> تحديث البيانات عند حدوث تغييرات</li>
              </ul>
            </div>

            <h3>18.3 أفضل ممارسات خدمة العملاء</h3>
            <div class="module-section">
              <h4>😊 تحسين تجربة العميل:</h4>
              <ul>
                <li><strong>الاستجابة السريعة:</strong> الرد على استفسارات العملاء خلال 24 ساعة</li>
                <li><strong>الشفافية:</strong> وضوح في الأسعار والشروط</li>
                <li><strong>المتابعة:</strong> متابعة رضا العميل بعد كل خدمة</li>
                <li><strong>التحسين المستمر:</strong> تطوير الخدمة بناءً على التغذية الراجعة</li>
                <li><strong>التدريب المستمر:</strong> تدريب الموظفين على مهارات الخدمة</li>
                <li><strong>حل المشاكل:</strong> حل مشاكل العملاء بطريقة احترافية</li>
              </ul>
            </div>

            <h3>18.4 أفضل ممارسات إدارة الأسطول</h3>
            <div class="flowchart-section">
              <h4>🚗 تحسين استخدام الأسطول:</h4>
              <ul>
                <li><strong>الصيانة الوقائية:</strong> اتباع جدولة صيانة دقيقة</li>
                <li><strong>مراقبة الاستخدام:</strong> تتبع أداء كل مركبة</li>
                <li><strong>التنويع:</strong> توفير مجموعة متنوعة من المركبات</li>
                <li><strong>التجديد المنتظم:</strong> تجديد الأسطول كل 3-5 سنوات</li>
                <li><strong>التأمين الشامل:</strong> ضمان تغطية تأمينية كاملة</li>
                <li><strong>تدريب السائقين:</strong> تدريب العملاء على الاستخدام الآمن</li>
              </ul>
            </div>
          </section>

          <section id="glossary">
            <h2>19. قاموس المصطلحات</h2>
            
            <div class="glossary-term">
              <h4>📋 مصطلحات العقود:</h4>
              <ul>
                <li><strong>المسودة (Draft):</strong> عقد تم إنشاؤه ولم يكتمل بعد</li>
                <li><strong>المعلقة (Pending):</strong> عقد في انتظار الاعتماد</li>
                <li><strong>النشطة (Active):</strong> عقد معتمد وجاري التنفيذ</li>
                <li><strong>المكتملة (Completed):</strong> عقد منتهي وتم إغلاقه</li>
                <li><strong>مبلغ الضمان:</strong> مبلغ قابل للاسترداد كضمان للمركبة</li>
                <li><strong>التمديد:</strong> زيادة فترة العقد الأصلية</li>
              </ul>
            </div>

            <div class="glossary-term">
              <h4>💰 مصطلحات محاسبية:</h4>
              <ul>
                <li><strong>القيد المحاسبي:</strong> تسجيل محاسبي للمعاملة المالية</li>
                <li><strong>المدين:</strong> الطرف الذي عليه دين</li>
                <li><strong>الدائن:</strong> الطرف الذي له حق مالي</li>
                <li><strong>الميزانية العمومية:</strong> تقرير المركز المالي</li>
                <li><strong>قائمة الدخل:</strong> تقرير الإيرادات والمصروفات</li>
                <li><strong>مركز التكلفة:</strong> وحدة تنظيمية لتوزيع التكاليف</li>
              </ul>
            </div>

            <div class="glossary-term">
              <h4>🚗 مصطلحات الأسطول:</h4>
              <ul>
                <li><strong>معدل الإشغال:</strong> نسبة أيام التأجير من إجمالي الأيام</li>
                <li><strong>الصيانة الوقائية:</strong> صيانة منتظمة لتجنب الأعطال</li>
                <li><strong>التأمين الشامل:</strong> تأمين يغطي جميع المخاطر</li>
                <li><strong>رقم الشاسيه:</strong> الرقم التسلسلي الفريد للمركبة</li>
                <li><strong>بوليصة التأمين:</strong> وثيقة التأمين الرسمية</li>
                <li><strong>الاستهلاك:</strong> انخفاض قيمة المركبة مع الوقت</li>
              </ul>
            </div>

            <div class="glossary-term">
              <h4>👥 مصطلحات الموارد البشرية:</h4>
              <ul>
                <li><strong>كشف الراتب:</strong> تفصيل الراتب والاستقطاعات</li>
                <li><strong>العمل الإضافي:</strong> ساعات عمل زائدة عن الدوام الرسمي</li>
                <li><strong>تعويض نهاية الخدمة:</strong> مكافأة نهاية الخدمة</li>
                <li><strong>الإجازة السنوية:</strong> إجازة مدفوعة الأجر سنوياً</li>
                <li><strong>التقييم السنوي:</strong> تقييم أداء الموظف</li>
                <li><strong>البدلات:</strong> مبالغ إضافية للراتب الأساسي</li>
              </ul>
            </div>
          </section>

          <section id="appendix">
            <h2>20. الملاحق والمراجع</h2>
            
            <h3>20.1 جداول المرجعية</h3>
            <div class="module-section">
              <h4>📊 أكواد دليل الحسابات:</h4>
              <table style="font-size: 14px;">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>اسم الحساب</th>
                    <th>النوع</th>
                    <th>الفئة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1110</td><td>صندوق النقدية</td><td>أصل</td><td>متداول</td></tr>
                  <tr><td>1120</td><td>البنوك</td><td>أصل</td><td>متداول</td></tr>
                  <tr><td>1130</td><td>المدينون</td><td>أصل</td><td>متداول</td></tr>
                  <tr><td>1310</td><td>المركبات</td><td>أصل</td><td>ثابت</td></tr>
                  <tr><td>2110</td><td>الرواتب المستحقة</td><td>خصم</td><td>متداول</td></tr>
                  <tr><td>4110</td><td>إيرادات التأجير</td><td>إيراد</td><td>تشغيلي</td></tr>
                  <tr><td>5110</td><td>رواتب وأجور</td><td>مصروف</td><td>تشغيلي</td></tr>
                  <tr><td>5120</td><td>استهلاك المركبات</td><td>مصروف</td><td>استهلاك</td></tr>
                </tbody>
              </table>
            </div>

            <h3>20.2 أرقام الاتصال المهمة</h3>
            <div class="info-box">
              <h4>📞 جهات الاتصال:</h4>
              <ul>
                <li><strong>الدعم الفني:</strong> 1828 (24 ساعة)</li>
                <li><strong>الطوارئ التقنية:</strong> 9999 1828 (+965)</li>
                <li><strong>إدارة المرور:</strong> 1880</li>
                <li><strong>الإطفاء:</strong> 777</li>
                <li><strong>الشرطة:</strong> 112</li>
                <li><strong>الإسعاف:</strong> 777</li>
              </ul>
            </div>

            <h3>20.3 المراجع والمصادر</h3>
            <div class="best-practice">
              <h4>📚 مصادر إضافية:</h4>
              <ul>
                <li><strong>قانون الشركات الكويتي:</strong> القوانين المحلية ذات الصلة</li>
                <li><strong>معايير المحاسبة الدولية:</strong> IFRS وتطبيقها في الكويت</li>
                <li><strong>أنظمة المرور:</strong> قوانين المرور في دولة الكويت</li>
                <li><strong>قوانين التأمين:</strong> أنظمة التأمين المحلية</li>
                <li><strong>قوانين العمل:</strong> قانون العمل في القطاع الخاص</li>
                <li><strong>الأنظمة الضريبية:</strong> ضريبة القيمة المضافة وتطبيقاتها</li>
              </ul>
            </div>

            <h3>20.4 تحديثات النظام</h3>
            <div class="warning-box">
              <h4>🔄 سجل التحديثات:</h4>
              <ul>
                <li><strong>الإصدار 2.0:</strong> دليل المستخدم الشامل والموسوعي</li>
                <li><strong>ميزات جديدة:</strong> التوقيع الإلكتروني، التحليلات المتقدمة</li>
                <li><strong>تحسينات الأداء:</strong> تحسين سرعة النظام بنسبة 40%</li>
                <li><strong>إضافات الأمان:</strong> طبقات حماية إضافية</li>
                <li><strong>واجهة محسنة:</strong> تجربة مستخدم أفضل</li>
                <li><strong>تقارير جديدة:</strong> 15 تقرير إضافي</li>
              </ul>
            </div>

            <div class="best-practice" style="margin-top: 40px; text-align: center;">
              <h4>🎯 خاتمة الدليل</h4>
              <p style="font-size: 18px; color: #1e40af; font-weight: 600;">
                هذا الدليل الشامل يغطي جميع جوانب نظام إدارة تأجير المركبات
                <br>
                للمزيد من المساعدة، يرجى التواصل مع فريق الدعم
                <br>
                <strong>نتمنى لكم تجربة ممتازة مع النظام 🚗</strong>
              </p>
            </div>
          </section>
        </div>
      `
    },

    'contracts-guide': {
      id: 'contracts-guide',
      title: 'دليل إدارة العقود',
      description: 'شرح مفصل لجميع مراحل العقد من الإنشاء حتى الإكمال',
      content: `
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل إدارة العقود</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>دورة حياة العقد الكاملة</p>
              <p>الإصدار 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>

          <section id="contract-stages">
            <h2>مراحل العقد</h2>
            
            <div class="stage-section">
              <h3>1. المسودة (Draft)</h3>
              <p>هذه المرحلة الأولى للعقد حيث يتم إدخال البيانات الأساسية.</p>
              
              <h4>المطلوب:</h4>
              <ul>
                <li>اختيار العميل</li>
                <li>اختيار المركبة</li>
                <li>تحديد فترة الإيجار</li>
                <li>إدخال تفاصيل التسعير</li>
              </ul>
              
              <h4>العمليات المتاحة:</h4>
              <ul>
                <li>التعديل</li>
                <li>الحذف</li>
                <li>إرسال للاعتماد</li>
              </ul>
            </div>

            <div class="stage-section">
              <h3>2. المعلقة (Pending)</h3>
              <p>العقود في انتظار الاعتماد من المدير.</p>
              
              <h4>العمليات المتاحة:</h4>
              <ul>
                <li>الاعتماد</li>
                <li>الرفض مع تسجيل السبب</li>
                <li>العودة للمسودة للتعديل</li>
              </ul>
            </div>

            <div class="stage-section">
              <h3>3. النشطة (Active)</h3>
              <p>العقود المعتمدة والجاهزة للتنفيذ.</p>
              
              <h4>العمليات المتاحة:</h4>
              <ul>
                <li>تسليم المركبة</li>
                <li>تعديل بيانات الاتصال</li>
                <li>إضافة ملاحظات</li>
                <li>إنشاء فواتير إضافية</li>
              </ul>
            </div>

            <div class="stage-section">
              <h3>4. المكتملة (Completed)</h3>
              <p>العقود المنتهية وتم استقبال المركبة.</p>
              
              <h4>المعلومات المتاحة:</h4>
              <ul>
                <li>تاريخ التسليم والاستقبال</li>
                <li>تقرير حالة المركبة</li>
                <li>الرسوم الإضافية</li>
                <li>إجمالي المبلغ المدفوع</li>
              </ul>
            </div>
          </section>

          <section id="create-contract">
            <h2>إنشاء عقد جديد</h2>
            
            <div class="step-section">
              <h3>الخطوة 1: البيانات الأساسية</h3>
              
              <h4>1. اختيار العميل:</h4>
              <ul>
                <li>ابحث عن العميل بالاسم أو رقم الهوية</li>
                <li>إذا لم يكن موجود، انقر "إضافة عميل جديد"</li>
                <li>أدخل البيانات المطلوبة:
                  <ul>
                    <li>الاسم الكامل</li>
                    <li>رقم الهوية المدنية</li>
                    <li>رقم الهاتف</li>
                    <li>عنوان السكن</li>
                    <li>رقم رخصة القيادة</li>
                  </ul>
                </li>
              </ul>

              <h4>2. اختيار المركبة:</h4>
              <ul>
                <li>اعرض المركبات المتاحة في الفترة المطلوبة</li>
                <li>استخدم المرشحات:
                  <ul>
                    <li>نوع المركبة</li>
                    <li>عدد المقاعد</li>
                    <li>السعر اليومي</li>
                    <li>المميزات</li>
                  </ul>
                </li>
                <li>تحقق من حالة المركبة</li>
              </ul>

              <h4>3. تحديد فترة الإيجار:</h4>
              <ul>
                <li>تاريخ البداية (لا يمكن أن يكون في الماضي)</li>
                <li>تاريخ النهاية</li>
                <li>النظام يحسب عدد الأيام تلقائياً</li>
                <li>تحقق من عدم تعارض مع حجز آخر</li>
              </ul>
            </div>

            <div class="step-section">
              <h3>الخطوة 2: التسعير</h3>
              
              <h4>1. السعر الأساسي:</h4>
              <p>السعر اليومي × عدد الأيام - يظهر تلقائياً من بيانات المركبة</p>

              <h4>2. الخصومات:</h4>
              <ul>
                <li>خصم نسبة مئوية</li>
                <li>خصم مبلغ ثابت</li>
                <li>أسباب الخصم مطلوبة للمراجعة</li>
              </ul>

              <h4>3. الضرائب:</h4>
              <ul>
                <li>ضريبة القيمة المضافة (حسب القانون الكويتي)</li>
                <li>ضرائب أخرى حسب نوع الخدمة</li>
              </ul>

              <h4>4. التأمين:</h4>
              <ul>
                <li>تأمين إجباري</li>
                <li>تأمين شامل (اختياري)</li>
                <li>تأمين ضد السرقة</li>
              </ul>

              <h4>5. الضمان:</h4>
              <ul>
                <li>مبلغ الضمان (قابل للاسترداد)</li>
                <li>طريقة دفع الضمان</li>
              </ul>
            </div>
          </section>

          <section id="vehicle-delivery">
            <h2>تسليم المركبة</h2>
            
            <div class="delivery-section">
              <h3>التحضير للتسليم</h3>
              
              <h4>1. التحقق من الدفع:</h4>
              <ul>
                <li>تأكد من دفع المبلغ المطلوب</li>
                <li>سجل طريقة الدفع</li>
                <li>أصدر إيصال الدفع</li>
              </ul>

              <h4>2. فحص المركبة:</h4>
              <ul>
                <li>تأكد من نظافة المركبة</li>
                <li>تحقق من مستوى الوقود</li>
                <li>فحص إطارات السيارة</li>
                <li>تأكد من وجود جميع الوثائق</li>
              </ul>
            </div>

            <div class="delivery-section">
              <h3>عملية التسليم</h3>
              
              <h4>1. توثيق حالة المركبة:</h4>
              <ul>
                <li>التقط صور من 6 زوايا خارجية</li>
                <li>التقط صور للداخل</li>
                <li>صورة للعداد</li>
                <li>صورة لمؤشر الوقود</li>
              </ul>

              <h4>2. تسجيل الملاحظات:</h4>
              <ul>
                <li>أي خدوش أو أضرار موجودة</li>
                <li>حالة الإطارات</li>
                <li>حالة الداخل</li>
                <li>مستوى الوقود بالضبط</li>
              </ul>

              <h4>3. التوقيع:</h4>
              <ul>
                <li>اطلب من العميل مراجعة التقرير</li>
                <li>التوقيع على تقرير حالة المركبة</li>
                <li>التوقيع على استلام المفاتيح</li>
                <li>نسخة للعميل ونسخة للملف</li>
              </ul>
            </div>
          </section>
        </div>
      `
    },

    'accounting-guide': {
      id: 'accounting-guide',
      title: 'دليل النظام المحاسبي',
      description: 'دليل شامل للنظام المحاسبي ودليل الحسابات والقيود',
      content: `
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل النظام المحاسبي</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>وفقاً لمعايير المحاسبة الكويتية</p>
              <p>الإصدار 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>

          <section id="chart-of-accounts">
            <h2>دليل الحسابات</h2>
            
            <div class="accounts-section">
              <h3>1. الأصول (Assets) - 1XXX</h3>
              
              <h4>الأصول الجارية (11XX):</h4>
              <ul>
                <li><strong>1110:</strong> صندوق النقدية</li>
                <li><strong>1120:</strong> البنوك</li>
                <li><strong>1130:</strong> المدينون (العملاء)</li>
                <li><strong>1140:</strong> المخالفات المرورية المدينة</li>
                <li><strong>1150:</strong> المخزون</li>
                <li><strong>1160:</strong> المصروفات المدفوعة مقدماً</li>
              </ul>

              <h4>الأصول الثابتة (13XX):</h4>
              <ul>
                <li><strong>1310:</strong> المركبات (بالتكلفة)</li>
                <li><strong>1320:</strong> مجمع استهلاك المركبات</li>
                <li><strong>1330:</strong> المباني والإنشاءات</li>
                <li><strong>1340:</strong> الأثاث والمعدات</li>
                <li><strong>1350:</strong> الأجهزة والحاسوب</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>2. الخصوم (Liabilities) - 2XXX</h3>
              
              <h4>الخصوم الجارية (21XX):</h4>
              <ul>
                <li><strong>2110:</strong> الرواتب والأجور المستحقة</li>
                <li><strong>2120:</strong> الضرائب المستحقة</li>
                <li><strong>2121:</strong> التأمينات المستحقة</li>
                <li><strong>2150:</strong> الدائنون (الموردون)</li>
                <li><strong>2160:</strong> فواتير في انتظار السداد</li>
              </ul>

              <h4>الخصوم طويلة الأجل (22XX):</h4>
              <ul>
                <li><strong>2210:</strong> قروض طويلة الأجل</li>
                <li><strong>2220:</strong> مخصص تعويض نهاية الخدمة</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>3. حقوق الملكية (Equity) - 3XXX</h3>
              <ul>
                <li><strong>3110:</strong> رأس المال</li>
                <li><strong>3120:</strong> الاحتياطيات</li>
                <li><strong>3130:</strong> الأرباح المدورة</li>
                <li><strong>3140:</strong> أرباح السنة الجارية</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>4. الإيرادات (Revenue) - 4XXX</h3>
              <ul>
                <li><strong>4110:</strong> إيرادات تأجير المركبات</li>
                <li><strong>4120:</strong> إيرادات الخدمات الإضافية</li>
                <li><strong>4130:</strong> إيرادات التأمين</li>
                <li><strong>4140:</strong> إيرادات الضمانات المصادرة</li>
                <li><strong>4150:</strong> إيرادات المخالفات المرورية</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>5. المصروفات (Expenses) - 5XXX</h3>
              
              <h4>مصروفات التشغيل (51XX):</h4>
              <ul>
                <li><strong>5110:</strong> رواتب وأجور</li>
                <li><strong>5111:</strong> علاوات ومكافآت</li>
                <li><strong>5112:</strong> ساعات إضافية</li>
                <li><strong>5120:</strong> استهلاك المركبات</li>
                <li><strong>5130:</strong> صيانة وإصلاح المركبات</li>
                <li><strong>5140:</strong> تأمين المركبات</li>
                <li><strong>5150:</strong> وقود المركبات</li>
              </ul>

              <h4>المصروفات الإدارية (52XX):</h4>
              <ul>
                <li><strong>5210:</strong> إيجار المكاتب</li>
                <li><strong>5220:</strong> كهرباء وماء وهاتف</li>
                <li><strong>5230:</strong> مواد مكتبية</li>
                <li><strong>5240:</strong> صيانة المعدات</li>
                <li><strong>5250:</strong> رسوم ومتنوعة</li>
              </ul>
            </div>
          </section>

          <section id="journal-entries">
            <h2>القيود المحاسبية</h2>
            
            <div class="entries-section">
              <h3>1. قيود العقود</h3>
              
              <h4>عند إنشاء العقد:</h4>
              <div class="entry-example">
                <pre>
من حـ/ المدينون (العملاء)          XXX
    إلى حـ/ إيرادات التأجير              XXX
                </pre>
              </div>

              <h4>عند الدفع:</h4>
              <div class="entry-example">
                <pre>
من حـ/ صندوق النقدية             XXX
    إلى حـ/ المدينون (العملاء)         XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>2. قيود الرواتب</h3>
              
              <h4>راتب شهري:</h4>
              <div class="entry-example">
                <pre>
من حـ/ رواتب وأجور              XXX
من حـ/ التأمينات (حصة الشركة)    XXX
    إلى حـ/ الرواتب المستحقة           XXX
    إلى حـ/ الضرائب المستحقة          XXX  
    إلى حـ/ التأمينات المستحقة         XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>3. قيود المخالفات المرورية</h3>
              
              <h4>عند تسجيل المخالفة:</h4>
              <div class="entry-example">
                <pre>
من حـ/ المخالفات المرورية المدينة   XXX
    إلى حـ/ إيرادات المخالفات المرورية  XXX
                </pre>
              </div>

              <h4>عند دفع المخالفة:</h4>
              <div class="entry-example">
                <pre>
من حـ/ صندوق النقدية             XXX
    إلى حـ/ المخالفات المرورية المدينة  XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>4. قيود الاستهلاك</h3>
              
              <h4>استهلاك شهري للمركبات:</h4>
              <div class="entry-example">
                <pre>
من حـ/ استهلاك المركبات          XXX
    إلى حـ/ مجمع استهلاك المركبات     XXX
                </pre>
              </div>
            </div>
          </section>

          <section id="financial-reports">
            <h2>التقارير المحاسبية</h2>
            
            <div class="report-section">
              <h3>1. الميزانية العمومية</h3>
              <p><strong>الغرض:</strong> عرض المركز المالي للشركة في تاريخ محدد</p>
              
              <h4>المحتويات:</h4>
              <ul>
                <li>الأصول (جارية + ثابتة)</li>
                <li>الخصوم (جارية + طويلة الأجل)</li>
                <li>حقوق الملكية</li>
              </ul>

              <h4>كيفية الإنشاء:</h4>
              <ol>
                <li>انتقل إلى "التقارير" → "الميزانية العمومية"</li>
                <li>اختر التاريخ المطلوب</li>
                <li>اختر مستوى التفصيل</li>
                <li>انقر "إنشاء التقرير"</li>
              </ol>
            </div>

            <div class="report-section">
              <h3>2. قائمة الدخل</h3>
              <p><strong>الغرض:</strong> عرض الإيرادات والمصروفات لفترة محددة</p>
              
              <h4>المحتويات:</h4>
              <ul>
                <li>الإيرادات</li>
                <li>المصروفات</li>
                <li>صافي الربح/الخسارة</li>
              </ul>

              <h4>كيفية الإنشاء:</h4>
              <ol>
                <li>انتقل إلى "التقارير" → "قائمة الدخل"</li>
                <li>اختر الفترة (من - إلى)</li>
                <li>اختر نوع التقرير (شهري/ربع سنوي/سنوي)</li>
                <li>انقر "إنشاء التقرير"</li>
              </ol>
            </div>
          </section>
        </div>
      `
    },

    'troubleshooting-guide': {
      id: 'troubleshooting-guide',
      title: 'دليل استكشاف الأخطاء وحلها',
      description: 'دليل شامل لحل جميع المشاكل الشائعة وإجراءات الطوارئ',
      content: `
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل استكشاف الأخطاء</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>حلول شاملة للمشاكل الشائعة</p>
              <p>الإصدار 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>

          <section id="login-issues">
            <h2>مشاكل تسجيل الدخول</h2>
            
            <div class="problem-section">
              <h3>لا يمكن تسجيل الدخول</h3>
              
              <h4>الأعراض:</h4>
              <ul>
                <li>رسالة خطأ "اسم المستخدم أو كلمة المرور خاطئة"</li>
                <li>عدم استجابة زر تسجيل الدخول</li>
                <li>إعادة توجيه إلى صفحة الدخول مرة أخرى</li>
              </ul>

              <h4>الحلول:</h4>
              
              <div class="solution">
                <h5>1. تحقق من البيانات:</h5>
                <ul>
                  <li>تأكد من صحة اسم المستخدم</li>
                  <li>تأكد من صحة كلمة المرور</li>
                  <li>انتبه لحالة الأحرف (كبيرة/صغيرة)</li>
                  <li>تحقق من لغة لوحة المفاتيح</li>
                </ul>
              </div>

              <div class="solution">
                <h5>2. مسح ذاكرة المتصفح:</h5>
                <ul>
                  <li>اضغط Ctrl+Shift+Delete</li>
                  <li>اختر "ذاكرة التخزين المؤقت"</li>
                  <li>انقر "مسح البيانات"</li>
                  <li>أعد تحديث الصفحة</li>
                </ul>
              </div>

              <div class="solution">
                <h5>3. تجربة متصفح آخر:</h5>
                <ul>
                  <li>جرب Chrome أو Firefox أو Edge</li>
                  <li>تأكد من تحديث المتصفح</li>
                </ul>
              </div>

              <div class="note">
                <p><strong>إذا لم تنجح الحلول:</strong> تواصل مع مدير النظام لإعادة تعيين كلمة المرور.</p>
              </div>
            </div>
          </section>

          <section id="performance-issues">
            <h2>مشاكل الأداء</h2>
            
            <div class="problem-section">
              <h3>النظام بطيء</h3>
              
              <h4>الأعراض:</h4>
              <ul>
                <li>تحميل الصفحات يستغرق وقت طويل</li>
                <li>عدم استجابة الأزرار</li>
                <li>انقطاع في العمليات</li>
              </ul>

              <h4>الحلول:</h4>
              
              <div class="solution">
                <h5>1. تحسين المتصفح:</h5>
                <ul>
                  <li>أغلق التبويبات غير المستخدمة</li>
                  <li>أعد تشغيل المتصفح</li>
                  <li>امسح ملفات الإنترنت المؤقتة</li>
                </ul>
              </div>

              <div class="solution">
                <h5>2. تحقق من الإنترنت:</h5>
                <ul>
                  <li>قس سرعة الإنترنت</li>
                  <li>تأكد من استقرار الاتصال</li>
                  <li>جرب إعادة تشغيل المودم</li>
                </ul>
              </div>

              <div class="solution">
                <h5>3. تحسين الجهاز:</h5>
                <ul>
                  <li>أغلق البرامج غير الضرورية</li>
                  <li>تحقق من مساحة القرص الصلب</li>
                  <li>أعد تشغيل الجهاز</li>
                </ul>
              </div>
            </div>

            <div class="problem-section">
              <h3>رسائل خطأ "انتهت مهلة الطلب"</h3>
              
              <h4>الحلول:</h4>
              <ul>
                <li>انتظر دقيقة وحاول مرة أخرى</li>
                <li>تحقق من اتصال الإنترنت</li>
                <li>قلل كمية البيانات المطلوبة (استخدم المرشحات)</li>
              </ul>
            </div>
          </section>

          <section id="printing-issues">
            <h2>مشاكل الطباعة</h2>
            
            <div class="problem-section">
              <h3>لا تعمل الطباعة</h3>
              
              <h4>الأعراض:</h4>
              <ul>
                <li>لا يظهر مربع حوار الطباعة</li>
                <li>الطباعة تتوقف في منتصف العملية</li>
                <li>التنسيق مختلط عند الطباعة</li>
              </ul>

              <h4>الحلول:</h4>
              
              <div class="solution">
                <h5>1. إعدادات المتصفح:</h5>
                <ul>
                  <li>تأكد من السماح للموقع بالطباعة</li>
                  <li>تحقق من إعدادات النوافذ المنبثقة</li>
                  <li>جرب Ctrl+P للطباعة اليدوية</li>
                </ul>
              </div>

              <div class="solution">
                <h5>2. إعدادات الطابعة:</h5>
                <ul>
                  <li>تأكد من تشغيل الطابعة</li>
                  <li>تحقق من توفر الورق والحبر</li>
                  <li>جرب طباعة صفحة تجريبية</li>
                </ul>
              </div>

              <div class="solution">
                <h5>3. تنسيق الطباعة:</h5>
                <ul>
                  <li>اختر حجم الورق A4</li>
                  <li>استخدم الاتجاه العمودي</li>
                  <li>قلل هوامش الصفحة</li>
                </ul>
              </div>
            </div>

            <div class="problem-section">
              <h3>مشاكل تنسيق العقود</h3>
              
              <h4>الحلول:</h4>
              <ol>
                <li>استخدم خيار "طباعة ودية" إن وجد</li>
                <li>جرب تصدير PDF ثم الطباعة</li>
                <li>تحقق من إعدادات الخط والحجم</li>
              </ol>
            </div>
          </section>

          <section id="data-issues">
            <h2>مشاكل البيانات</h2>
            
            <div class="problem-section">
              <h3>البيانات لا تحفظ</h3>
              
              <h4>الأعراض:</h4>
              <ul>
                <li>رسالة نجح الحفظ لكن البيانات لا تظهر</li>
                <li>فقدان البيانات عند إعادة تحديث الصفحة</li>
                <li>خطأ عند الحفظ</li>
              </ul>

              <h4>الحلول:</h4>
              
              <div class="solution">
                <h5>1. تحقق من الحقول:</h5>
                <ul>
                  <li>تأكد من ملء جميع الحقول المطلوبة (*)</li>
                  <li>راجع صيغة البيانات (تواريخ، أرقام)</li>
                  <li>تحقق من الحدود المسموحة</li>
                </ul>
              </div>

              <div class="solution">
                <h5>2. إعادة المحاولة:</h5>
                <ul>
                  <li>انتظر قليلاً وحاول مرة أخرى</li>
                  <li>احفظ نسخة من البيانات قبل المحاولة</li>
                  <li>جرب حفظ أجزاء صغيرة</li>
                </ul>
              </div>

              <div class="solution">
                <h5>3. تحقق من الجلسة:</h5>
                <ul>
                  <li>قد تكون انتهت جلسة العمل</li>
                  <li>سجل خروج ثم دخول مرة أخرى</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="emergency-procedures">
            <h2>إجراءات الطوارئ</h2>
            
            <div class="emergency-section">
              <h3>فقدان البيانات</h3>
              
              <h4>الخطوات الفورية:</h4>
              <ol>
                <li>لا تدخل بيانات جديدة</li>
                <li>سجل ما حدث بالتفصيل</li>
                <li>تواصل مع المدير فوراً</li>
                <li>احتفظ بأي نسخ احتياطية لديك</li>
              </ol>
            </div>

            <div class="emergency-section">
              <h3>عطل في النظام</h3>
              
              <h4>عندما لا يعمل النظام:</h4>
              <ol>
                <li>تحقق من اتصال الإنترنت</li>
                <li>جرب متصفح آخر</li>
                <li>انتظر 10 دقائق وحاول مرة أخرى</li>
                <li>تواصل مع الدعم الفني</li>
              </ol>
            </div>

            <div class="emergency-section">
              <h3>اختراق أمني محتمل</h3>
              
              <h4>علامات الاختراق:</h4>
              <ul>
                <li>تغيير في البيانات بدون تفسير</li>
                <li>دخول غير مصرح</li>
                <li>رسائل أو تنبيهات غريبة</li>
              </ul>

              <h4>الإجراءات:</h4>
              <ol>
                <li>غير كلمة المرور فوراً</li>
                <li>سجل خروج من جميع الأجهزة</li>
                <li>أبلغ مدير النظام</li>
                <li>لا تدخل بيانات حساسة</li>
              </ol>
            </div>
          </section>

          <section id="contact-info">
            <h2>معلومات الاتصال للدعم</h2>
            
            <div class="contact-section">
              <h3>الدعم الفني السريع</h3>
              <ul>
                <li><strong>الهاتف:</strong> [رقم الطوارئ]</li>
                <li><strong>واتساب:</strong> [رقم واتساب]</li>
                <li><strong>متاح:</strong> 24/7 للمشاكل الحرجة</li>
              </ul>
            </div>

            <div class="contact-section">
              <h3>الدعم الفني العادي</h3>
              <ul>
                <li><strong>الهاتف:</strong> [رقم الدعم]</li>
                <li><strong>البريد:</strong> [بريد الدعم]</li>
                <li><strong>ساعات العمل:</strong> 8:00 ص - 5:00 م</li>
              </ul>
            </div>

            <div class="contact-section">
              <h3>قبل الاتصال بالدعم</h3>
              
              <h4>جهز هذه المعلومات:</h4>
              <ol>
                <li>اسم المستخدم</li>
                <li>وصف المشكلة بالتفصيل</li>
                <li>الخطوات التي جربتها</li>
                <li>رسائل الخطأ (التقط صورة للشاشة)</li>
                <li>نوع المتصفح والجهاز</li>
              </ol>
            </div>
          </section>
        </div>
      `
    },

    'setup-guide': {
      id: 'setup-guide',
      title: 'دليل الإعداد والتكوين',
      description: 'دليل شامل لإعداد النظام وتكوين الشركة والإعدادات الأولية',
      content: `
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل الإعداد والتكوين</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>للمديرين والمطورين</p>
              <p>الإصدار 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>

          <section id="system-requirements">
            <h2>متطلبات النظام</h2>
            
            <div class="requirements-section">
              <h3>متطلبات المتصفح</h3>
              
              <h4>المتصفحات المدعومة:</h4>
              <ul>
                <li><strong>Google Chrome</strong> (الإصدار 90 أو أحدث) - مُوصى به</li>
                <li><strong>Mozilla Firefox</strong> (الإصدار 88 أو أحدث)</li>
                <li><strong>Microsoft Edge</strong> (الإصدار 90 أو أحدث)</li>
                <li><strong>Safari</strong> (الإصدار 14 أو أحدث)</li>
              </ul>

              <h4>الإعدادات المطلوبة:</h4>
              <ul>
                <li>تفعيل JavaScript</li>
                <li>تفعيل ملفات Cookies</li>
                <li>السماح بالنوافذ المنبثقة للموقع</li>
                <li>تفعيل الموقع الجغرافي (للحضور والانصراف)</li>
              </ul>
            </div>

            <div class="requirements-section">
              <h3>متطلبات الجهاز</h3>
              
              <h4>الحد الأدنى:</h4>
              <ul>
                <li><strong>ذاكرة الوصول العشوائي:</strong> 4 جيجابايت</li>
                <li><strong>مساحة القرص الصلب:</strong> 1 جيجابايت متاح</li>
                <li><strong>دقة الشاشة:</strong> 1024×768 بكسل</li>
              </ul>

              <h4>الموصى به:</h4>
              <ul>
                <li><strong>ذاكرة الوصول العشوائي:</strong> 8 جيجابايت أو أكثر</li>
                <li><strong>مساحة القرص الصلب:</strong> 5 جيجابايت متاح</li>
                <li><strong>دقة الشاشة:</strong> 1920×1080 بكسل أو أعلى</li>
              </ul>
            </div>

            <div class="requirements-section">
              <h3>متطلبات الشبكة</h3>
              <ul>
                <li><strong>سرعة إنترنت:</strong> 5 ميجابت/ثانية كحد أدنى</li>
                <li><strong>اتصال مستقر:</strong> بدون انقطاع متكرر</li>
                <li><strong>المنافذ:</strong> فتح المنافذ المطلوبة في الجدار الناري</li>
              </ul>
            </div>
          </section>

          <section id="initial-setup">
            <h2>الإعداد الأولي للنظام</h2>
            
            <div class="setup-section">
              <h3>1. تكوين الشركة</h3>
              
              <h4>البيانات الأساسية:</h4>
              <ol>
                <li>انتقل إلى "الإعدادات" → "بيانات الشركة"</li>
                <li>أدخل المعلومات التالية:
                  <ul>
                    <li>اسم الشركة (عربي وإنجليزي)</li>
                    <li>العنوان الكامل</li>
                    <li>أرقام الهواتف</li>
                    <li>البريد الإلكتروني</li>
                    <li>الموقع الإلكتروني</li>
                    <li>الرقم التجاري</li>
                    <li>الرقم الضريبي</li>
                  </ul>
                </li>
              </ol>

              <h4>الشعار والعلامة التجارية:</h4>
              <ol>
                <li>ارفع شعار الشركة (PNG أو JPG)</li>
                <li>اختر الألوان الأساسية للنظام</li>
                <li>حدد خط الطباعة المفضل</li>
              </ol>
            </div>

            <div class="setup-section">
              <h3>2. إعداد الفروع والمواقع</h3>
              
              <h4>إضافة فرع جديد:</h4>
              <ol>
                <li>انتقل إلى "الإعدادات" → "الفروع"</li>
                <li>انقر "إضافة فرع جديد"</li>
                <li>أدخل البيانات:
                  <ul>
                    <li>اسم الفرع</li>
                    <li>العنوان التفصيلي</li>
                    <li>إحداثيات GPS</li>
                    <li>نطاق المسافة المسموح (للحضور)</li>
                    <li>رقم الهاتف</li>
                    <li>اسم المدير</li>
                  </ul>
                </li>
              </ol>

              <h4>تحديد مواقع العمل:</h4>
              <ul>
                <li>استخدم خرائط Google لتحديد الموقع</li>
                <li>حدد نطاق دائري حول الموقع (50-200 متر)</li>
                <li>اختبر الموقع من أجهزة مختلفة</li>
              </ul>
            </div>

            <div class="setup-section">
              <h3>3. إعداد أدوار المستخدمين</h3>
              
              <h4>الأدوار الافتراضية:</h4>
              <ul>
                <li><strong>مدير عام:</strong> صلاحية كاملة</li>
                <li><strong>مدير مبيعات:</strong> العقود والعملاء</li>
                <li><strong>محاسب:</strong> المحاسبة والتقارير المالية</li>
                <li><strong>مدير أسطول:</strong> المركبات والصيانة</li>
                <li><strong>مدير موارد بشرية:</strong> الموظفين والحضور</li>
                <li><strong>موظف:</strong> محدودة حسب القسم</li>
              </ul>

              <h4>تخصيص الأدوار:</h4>
              <ol>
                <li>انتقل إلى "إدارة المستخدمين" → "الأدوار"</li>
                <li>اختر الدور المطلوب تعديله</li>
                <li>حدد الصلاحيات لكل وحدة:
                  <ul>
                    <li>عرض/إضافة/تعديل/حذف</li>
                    <li>اعتماد العمليات</li>
                    <li>طباعة التقارير</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section id="modules-setup">
            <h2>إعداد الوحدات</h2>
            
            <div class="module-setup">
              <h3>1. إعداد وحدة العقود</h3>
              
              <h4>إعدادات عامة:</h4>
              <ul>
                <li>رقم العقد الأولي</li>
                <li>تنسيق رقم العقد (AUTO-001)</li>
                <li>مدة العقد الافتراضية</li>
                <li>شروط الدفع الافتراضية</li>
              </ul>

              <h4>إعدادات التسعير:</h4>
              <ol>
                <li>انتقل إلى "الإعدادات" → "التسعير"</li>
                <li>حدد نسبة الضريبة (حسب القانون الكويتي)</li>
                <li>حدد نسبة التأمين الافتراضية</li>
                <li>أضف أنواع الخصومات المسموحة</li>
              </ol>

              <h4>قوالب العقود:</h4>
              <ul>
                <li>ارفع نموذج العقد القانوني</li>
                <li>أضف الشروط والأحكام الافتراضية</li>
                <li>حدد البيانات المتغيرة في النموذج</li>
              </ul>
            </div>

            <div class="module-setup">
              <h3>2. إعداد وحدة الأسطول</h3>
              
              <h4>تصنيفات المركبات:</h4>
              <ol>
                <li>انتقل إلى "الأسطول" → "الإعدادات"</li>
                <li>أضف أنواع المركبات:
                  <ul>
                    <li>سيدان</li>
                    <li>SUV</li>
                    <li>هاتشباك</li>
                    <li>فان</li>
                    <li>بيك أب</li>
                  </ul>
                </li>
              </ol>

              <h4>حالات المركبات:</h4>
              <ul>
                <li>متاحة للإيجار</li>
                <li>مؤجرة</li>
                <li>في الصيانة</li>
                <li>خارج الخدمة</li>
                <li>محجوزة</li>
              </ul>

              <h4>إعدادات الصيانة:</h4>
              <ul>
                <li>تحديد فترات الصيانة الدورية</li>
                <li>تنبيهات الصيانة المجدولة</li>
                <li>قوائم مراكز الصيانة المعتمدة</li>
              </ul>
            </div>

            <div class="module-setup">
              <h3>3. إعداد وحدة المحاسبة</h3>
              
              <h4>السنة المالية:</h4>
              <ol>
                <li>انتقل إلى "المحاسبة" → "الإعدادات"</li>
                <li>حدد تاريخ بداية السنة المالية</li>
                <li>حدد تاريخ نهاية السنة المالية</li>
                <li>اختر العملة الأساسية (KD - دينار كويتي)</li>
              </ol>

              <h4>دليل الحسابات:</h4>
              <ul>
                <li>استيراد دليل الحسابات القياسي</li>
                <li>تخصيص الحسابات حسب نشاط الشركة</li>
                <li>ربط الحسابات بالعمليات التلقائية</li>
              </ul>

              <h4>إعدادات الضرائب:</h4>
              <ul>
                <li>نسبة ضريبة القيمة المضافة</li>
                <li>حسابات الضرائب المستحقة</li>
                <li>إعدادات تقارير الضرائب</li>
              </ul>
            </div>
          </section>

          <section id="security-settings">
            <h2>إعدادات الأمان</h2>
            
            <div class="security-section">
              <h3>1. سياسات كلمات المرور</h3>
              
              <h4>متطلبات كلمة المرور:</h4>
              <ul>
                <li><strong>الحد الأدنى:</strong> 8 أحرف</li>
                <li><strong>يجب أن تحتوي على:</strong>
                  <ul>
                    <li>حرف كبير واحد على الأقل</li>
                    <li>حرف صغير واحد على الأقل</li>
                    <li>رقم واحد على الأقل</li>
                    <li>رمز خاص واحد على الأقل</li>
                  </ul>
                </li>
              </ul>

              <h4>إعدادات الجلسة:</h4>
              <ul>
                <li><strong>مدة الجلسة:</strong> 8 ساعات (قابلة للتخصيص)</li>
                <li><strong>إنهاء الجلسة عند عدم النشاط:</strong> 30 دقيقة</li>
                <li><strong>السماح بجلسة واحدة فقط</strong> لكل مستخدم</li>
              </ul>
            </div>

            <div class="security-section">
              <h3>2. تسجيل العمليات</h3>
              
              <h4>العمليات المسجلة:</h4>
              <ul>
                <li>تسجيل الدخول والخروج</li>
                <li>إنشاء وتعديل العقود</li>
                <li>العمليات المحاسبية</li>
                <li>تغيير البيانات الحساسة</li>
              </ul>

              <h4>معلومات السجل:</h4>
              <ul>
                <li>اسم المستخدم</li>
                <li>التاريخ والوقت</li>
                <li>عنوان IP</li>
                <li>تفاصيل العملية</li>
              </ul>
            </div>

            <div class="security-section">
              <h3>3. النسخ الاحتياطي</h3>
              
              <h4>الجدولة التلقائية:</h4>
              <ul>
                <li><strong>نسخة يومية</strong> في 2:00 صباحاً</li>
                <li><strong>نسخة أسبوعية</strong> (كاملة)</li>
                <li><strong>نسخة شهرية</strong> (أرشيف)</li>
              </ul>

              <h4>تشفير البيانات:</h4>
              <ul>
                <li>تشفير البيانات في قاعدة البيانات</li>
                <li>تشفير النسخ الاحتياطية</li>
                <li>تشفير الاتصال (SSL)</li>
              </ul>
            </div>
          </section>

          <section id="maintenance">
            <h2>الصيانة والمتابعة</h2>
            
            <div class="maintenance-section">
              <h3>المتابعة اليومية</h3>
              
              <h4>المهام اليومية:</h4>
              <ul>
                <li>مراجعة أداء النظام</li>
                <li>فحص ملفات السجل</li>
                <li>مراقبة استخدام المساحة</li>
                <li>تحديث النسخ الاحتياطية</li>
              </ul>
            </div>

            <div class="maintenance-section">
              <h3>الصيانة الدورية</h3>
              
              <h4>مهام أسبوعية:</h4>
              <ul>
                <li>تحديث النظام</li>
                <li>مراجعة الأمان</li>
                <li>تنظيف الملفات المؤقتة</li>
                <li>فحص قاعدة البيانات</li>
              </ul>

              <h4>مهام شهرية:</h4>
              <ul>
                <li>تحديث كلمات المرور</li>
                <li>مراجعة الصلاحيات</li>
                <li>تحليل الأداء</li>
                <li>تحديث الوثائق</li>
              </ul>
            </div>

            <div class="maintenance-section">
              <h3>خطة الطوارئ</h3>
              
              <h4>إجراءات الطوارئ:</h4>
              <ol>
                <li>خطة استعادة البيانات</li>
                <li>إجراءات حل مشاكل الأداء</li>
                <li>آلية التواصل مع الدعم</li>
                <li>بدائل العمل عند تعطل النظام</li>
              </ol>
            </div>
          </section>
        </div>
      `
    }
  };

  private getCommonStyles(): string {
    return `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #333;
            font-size: 12pt;
          }
          
          .guide-content {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          
          .cover-page {
            page-break-after: always;
            text-align: center;
            padding: 100px 20px;
            border: 3px solid #2563eb;
            margin-bottom: 40px;
          }
          
          .cover-page h1 {
            font-size: 28pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
          }
          
          .cover-page h2 {
            font-size: 20pt;
            color: #1e40af;
            margin-bottom: 40px;
          }
          
          .company-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
          }
          
          .company-info p {
            font-size: 14pt;
            margin: 10px 0;
            color: #64748b;
          }
          
          .table-of-contents {
            page-break-after: always;
            padding: 20px 0;
          }
          
          .table-of-contents h2 {
            font-size: 20pt;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          
          .table-of-contents ul {
            list-style: none;
            padding: 0;
          }
          
          .table-of-contents li {
            padding: 8px 0;
            border-bottom: 1px dotted #cbd5e1;
          }
          
          .table-of-contents a {
            text-decoration: none;
            color: #1e40af;
            font-weight: 500;
          }
          
          section {
            page-break-inside: avoid;
            margin-bottom: 30px;
          }
          
          h2 {
            font-size: 18pt;
            font-weight: bold;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 20px;
            page-break-after: avoid;
          }
          
          h3 {
            font-size: 16pt;
            font-weight: bold;
            color: #1e40af;
            margin-top: 25px;
            margin-bottom: 15px;
            page-break-after: avoid;
          }
          
          h4 {
            font-size: 14pt;
            font-weight: bold;
            color: #475569;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-after: avoid;
          }
          
          h5 {
            font-size: 13pt;
            font-weight: bold;
            color: #64748b;
            margin-top: 15px;
            margin-bottom: 8px;
            page-break-after: avoid;
          }
          
          p {
            margin: 10px 0;
            text-align: justify;
          }
          
          ul, ol {
            margin: 15px 0;
            padding-right: 25px;
          }
          
          li {
            margin: 8px 0;
          }
          
          .role-section,
          .stage-section,
          .step-section,
          .delivery-section,
          .accounts-section,
          .entries-section,
          .report-section,
          .problem-section,
          .requirements-section,
          .setup-section,
          .module-setup,
          .security-section,
          .maintenance-section {
            background: #f8fafc;
            padding: 20px;
            margin: 20px 0;
            border-right: 4px solid #2563eb;
            border-radius: 0 8px 8px 0;
            page-break-inside: avoid;
          }
          
          .role-details,
          .interface-section,
          .module-section,
          .operation-section,
          .reports-section,
          .solution,
          .emergency-section,
          .contact-section {
            margin: 15px 0;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .steps ol {
            background: #f1f5f9;
            padding: 15px 25px;
            border-radius: 6px;
            margin: 10px 0;
          }
          
          .entry-example {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            direction: ltr;
            text-align: left;
          }
          
          .entry-example pre {
            margin: 0;
            font-size: 11pt;
            line-height: 1.4;
            white-space: pre-wrap;
          }
          
          .note {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          
          .note p {
            margin: 0;
            color: #92400e;
          }
          
          strong {
            font-weight: bold;
            color: #1e40af;
          }
          
          /* تحسينات خاصة بالطباعة */
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          
          th, td {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            text-align: right;
          }
          
          th {
            background: #f1f5f9;
            font-weight: bold;
            color: #1e40af;
          }
        }
        
        /* إخفاء عناصر غير ضرورية عند الطباعة */
        @media print {
          .no-print {
            display: none !important;
          }
        }
        
        /* أنماط الشاشة */
        @media screen {
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
            padding: 20px;
          }
          
          .guide-content {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        }
      </style>
    `;
  }

  public generatePrintableHTML(guideId: string): string {
    const guide = this.guides[guideId];
    if (!guide) {
      throw new Error(`الدليل المطلوب غير موجود: ${guideId}`);
    }

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${guide.title}</title>
        ${this.getCommonStyles()}
      </head>
      <body>
        ${guide.content}
      </body>
      </html>
    `;
  }

  public openPrintWindow(guideId: string, filename: string): void {
    const htmlContent = this.generatePrintableHTML(guideId);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // انتظار تحميل المحتوى ثم فتح نافذة الطباعة
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      throw new Error('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.');
    }
  }

  public downloadAsHTML(guideId: string, filename: string): void {
    const htmlContent = this.generatePrintableHTML(guideId);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  public getAllGuides(): DocumentGuide[] {
    return Object.values(this.guides);
  }
}