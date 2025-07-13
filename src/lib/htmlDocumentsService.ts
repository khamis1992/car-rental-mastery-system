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
      title: 'دليل المستخدم - نظام إدارة تأجير المركبات',
      description: 'دليل شامل يغطي جميع أدوار المستخدمين والواجهات والعمليات الأساسية',
      content: `
        <div class="guide-content">
          <div class="cover-page">
            <h1>دليل المستخدم</h1>
            <h2>نظام إدارة تأجير المركبات</h2>
            <div class="company-info">
              <p>مصمم خصيصاً لدولة الكويت</p>
              <p>الإصدار 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>

          <div class="table-of-contents">
            <h2>المحتويات</h2>
            <ul>
              <li><a href="#introduction">1. نبذة عن النظام</a></li>
              <li><a href="#user-roles">2. أدوار المستخدمين</a></li>
              <li><a href="#interface">3. الواجهة الرئيسية</a></li>
              <li><a href="#modules">4. الوحدات الأساسية</a></li>
              <li><a href="#operations">5. العمليات اليومية</a></li>
              <li><a href="#reports">6. التقارير والتحليلات</a></li>
            </ul>
          </div>

          <section id="introduction">
            <h2>1. نبذة عن النظام</h2>
            <p>نظام إدارة تأجير المركبات هو نظام شامل مصمم خصيصاً لدولة الكويت لإدارة جميع عمليات تأجير المركبات، المحاسبة، إدارة الموظفين، والعمليات التشغيلية.</p>
            
            <h3>المميزات الرئيسية:</h3>
            <ul>
              <li>إدارة شاملة للعقود من البداية حتى النهاية</li>
              <li>نظام محاسبي متكامل وفق المعايير الكويتية</li>
              <li>إدارة الأسطول والصيانة</li>
              <li>نظام الموارد البشرية والحضور</li>
              <li>تقارير مالية وإدارية شاملة</li>
              <li>واجهة عربية بالكامل مع دعم RTL</li>
            </ul>
          </section>

          <section id="user-roles">
            <h2>2. أدوار المستخدمين</h2>
            
            <div class="role-section">
              <h3>2.1 المدير العام (Super Admin)</h3>
              <div class="role-details">
                <h4>الصلاحيات:</h4>
                <ul>
                  <li>الوصول الكامل لجميع الوحدات</li>
                  <li>إدارة المستخدمين والصلاحيات</li>
                  <li>تكوين النظام</li>
                  <li>عرض جميع التقارير</li>
                  <li>اعتماد العمليات المالية</li>
                </ul>
                
                <h4>الواجهة:</h4>
                <ul>
                  <li>لوحة تحكم شاملة مع جميع الإحصائيات</li>
                  <li>قائمة جانبية تحتوي على جميع الوحدات</li>
                  <li>إشعارات متقدمة لجميع الأنشطة</li>
                </ul>
              </div>
            </div>

            <div class="role-section">
              <h3>2.2 مدير المبيعات (Sales Manager)</h3>
              <div class="role-details">
                <h4>الصلاحيات:</h4>
                <ul>
                  <li>إدارة العقود والعروض</li>
                  <li>متابعة العملاء</li>
                  <li>عرض تقارير المبيعات</li>
                  <li>اعتماد الخصومات</li>
                </ul>
              </div>
            </div>

            <div class="role-section">
              <h3>2.3 المحاسب (Accountant)</h3>
              <div class="role-details">
                <h4>الصلاحيات:</h4>
                <ul>
                  <li>الوصول الكامل للوحدة المحاسبية</li>
                  <li>إدارة الفواتير والمدفوعات</li>
                  <li>إعداد التقارير المالية</li>
                  <li>مراجعة القيود المحاسبية</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="interface">
            <h2>3. الواجهة الرئيسية</h2>
            
            <h3>3.1 العناصر الأساسية</h3>
            
            <div class="interface-section">
              <h4>شريط التنقل العلوي</h4>
              <p>يقع في أعلى الصفحة ويحتوي على:</p>
              <ul>
                <li>شعار الشركة (يسار)</li>
                <li>اسم المستخدم والإعدادات (يمين)</li>
                <li>الإشعارات</li>
                <li>تسجيل الخروج</li>
              </ul>
            </div>

            <div class="interface-section">
              <h4>القائمة الجانبية</h4>
              <p>تقع على الجانب الأيسر وتحتوي على:</p>
              <ul>
                <li>جميع وحدات النظام</li>
                <li>قابلة للطي والتوسيع</li>
                <li>تتغير حسب صلاحيات المستخدم</li>
              </ul>
            </div>
          </section>

          <section id="modules">
            <h2>4. الوحدات الأساسية</h2>
            
            <div class="module-section">
              <h3>4.1 لوحة التحكم (Dashboard)</h3>
              <p><strong>الغرض:</strong> عرض نظرة شاملة على أداء الشركة</p>
              <p><strong>المكونات:</strong></p>
              <ul>
                <li>إحصائيات المبيعات</li>
                <li>حالة الأسطول</li>
                <li>المهام المعلقة</li>
                <li>التنبيهات المهمة</li>
              </ul>
            </div>

            <div class="module-section">
              <h3>4.2 العقود (Contracts)</h3>
              <p><strong>الغرض:</strong> إدارة عقود التأجير</p>
              <p><strong>المراحل:</strong></p>
              <ul>
                <li><strong>المسودات:</strong> عقود غير مكتملة</li>
                <li><strong>المعلقة:</strong> في انتظار الاعتماد</li>
                <li><strong>النشطة:</strong> عقود سارية</li>
                <li><strong>المكتملة:</strong> عقود منتهية</li>
              </ul>
            </div>
          </section>

          <section id="operations">
            <h2>5. العمليات اليومية</h2>
            
            <div class="operation-section">
              <h3>5.1 إنشاء عقد جديد</h3>
              <div class="steps">
                <h4>الخطوات:</h4>
                <ol>
                  <li>انتقل إلى "العقود" → "جديد"</li>
                  <li>اختر العميل أو أضف عميل جديد</li>
                  <li>اختر المركبة من القائمة المتاحة</li>
                  <li>حدد فترة الإيجار (تاريخ البداية والنهاية)</li>
                  <li>أدخل تفاصيل التسعير</li>
                  <li>أضف الشروط الخاصة إن وجدت</li>
                  <li>احفظ العقد كمسودة أو أرسله للاعتماد</li>
                </ol>
              </div>
            </div>

            <div class="operation-section">
              <h3>5.2 تسليم المركبة</h3>
              <div class="steps">
                <h4>قبل التسليم:</h4>
                <ol>
                  <li>افتح العقد من قائمة "العقود النشطة"</li>
                  <li>تأكد من دفع العميل للمبلغ المطلوب</li>
                  <li>اطبع العقد ووثائق التسليم</li>
                </ol>
                
                <h4>عملية التسليم:</h4>
                <ol>
                  <li>انقر على "تسليم المركبة"</li>
                  <li>التقط صور حالة المركبة من جميع الزوايا</li>
                  <li>سجل أي ملاحظات على حالة المركبة</li>
                  <li>أطلب من العميل التوقيع</li>
                  <li>اكمل عملية التسليم</li>
                </ol>
              </div>
            </div>
          </section>

          <section id="reports">
            <h2>6. التقارير والتحليلات</h2>
            
            <div class="reports-section">
              <h3>6.1 تقارير المبيعات</h3>
              <ul>
                <li>تقرير العقود اليومية</li>
                <li>تقرير الإيرادات الشهرية</li>
                <li>تقرير أداء المبيعات</li>
                <li>تحليل العملاء</li>
              </ul>
            </div>

            <div class="reports-section">
              <h3>6.2 تقارير الأسطول</h3>
              <ul>
                <li>تقرير حالة المركبات</li>
                <li>تقرير معدل الاستخدام</li>
                <li>تقرير الصيانة</li>
                <li>تقرير التأمين</li>
              </ul>
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
              <h3>1. الأصول (Assets) - 1XXXXX</h3>
              
              <h4>الأصول المتداولة (11XXXX):</h4>
              
              <h5>النقدية والبنوك (1101XX):</h5>
              <ul>
                <li><strong>110101:</strong> النقدية في الصندوق</li>
                <li><strong>110102:</strong> البنك التجاري الكويتي</li>
                <li><strong>110103:</strong> بنك الكويت الوطني</li>
                <li><strong>110104:</strong> بيت التمويل الكويتي</li>
                <li><strong>110105:</strong> بنك الخليج</li>
              </ul>

              <h5>الحسابات المدينة (1102XX):</h5>
              <ul>
                <li><strong>110201:</strong> عملاء - أفراد</li>
                <li><strong>110202:</strong> عملاء - شركات</li>
                <li><strong>110203:</strong> عملاء - جهات حكومية</li>
                <li><strong>110204:</strong> أوراق القبض</li>
                <li><strong>110205:</strong> مخصص الديون المشكوك فيها</li>
              </ul>

              <h5>المخزون (1103XX):</h5>
              <ul>
                <li><strong>110301:</strong> قطع الغيار</li>
                <li><strong>110302:</strong> المحروقات</li>
                <li><strong>110303:</strong> اللوازم المكتبية</li>
                <li><strong>110304:</strong> مواد التنظيف</li>
              </ul>

              <h4>الأصول الثابتة (12XXXX):</h4>
              <ul>
                <li><strong>120301:</strong> سيارات الأجرة</li>
                <li><strong>120302:</strong> الحافلات</li>
                <li><strong>120303:</strong> الشاحنات</li>
                <li><strong>120304:</strong> مجمع إهلاك المركبات</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>2. الخصوم (Liabilities) - 2XXXXX</h3>
              
              <h4>الخصوم المتداولة (21XXXX):</h4>
              <ul>
                <li><strong>210201:</strong> مستحقات الرواتب</li>
                <li><strong>210203:</strong> مستحقات ضريبية</li>
                <li><strong>210101:</strong> موردون</li>
                <li><strong>210102:</strong> أوراق الدفع</li>
                <li><strong>210301:</strong> ودائع العملاء</li>
              </ul>

              <h4>القروض طويلة الأجل (22XXXX):</h4>
              <ul>
                <li><strong>2201:</strong> قروض بنكية طويلة الأجل</li>
                <li><strong>2202:</strong> قروض أخرى طويلة الأجل</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>3. حقوق الملكية (Equity) - 3XXXXX</h3>
              <ul>
                <li><strong>3101:</strong> رأس المال المدفوع</li>
                <li><strong>3201:</strong> الاحتياطي القانوني</li>
                <li><strong>3301:</strong> أرباح مرحلة من سنوات سابقة</li>
                <li><strong>3302:</strong> أرباح السنة الحالية</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>4. الإيرادات (Revenue) - 4XXXXX</h3>
              
              <h4>إيرادات التأجير (41XXXX):</h4>
              <ul>
                <li><strong>410101:</strong> إيراد تأجير سيارات يومي</li>
                <li><strong>410102:</strong> إيراد تأجير سيارات أسبوعي</li>
                <li><strong>410103:</strong> إيراد تأجير سيارات شهري</li>
                <li><strong>410201:</strong> إيراد تأجير حافلات يومي</li>
              </ul>

              <h4>إيرادات الخدمات الإضافية (42XXXX):</h4>
              <ul>
                <li><strong>4201:</strong> إيرادات التوصيل والاستلام</li>
                <li><strong>4202:</strong> إيرادات الصيانة</li>
                <li><strong>4203:</strong> إيرادات التأمين الإضافي</li>
              </ul>
            </div>

            <div class="accounts-section">
              <h3>5. المصروفات (Expenses) - 5XXXXX</h3>
              
              <h4>مصروفات التشغيل (51XXXX):</h4>
              
              <h5>الرواتب والأجور (5101XX):</h5>
              <ul>
                <li><strong>510101:</strong> رواتب الإدارة</li>
                <li><strong>510102:</strong> رواتب الموظفين</li>
                <li><strong>510103:</strong> البدلات</li>
                <li><strong>510104:</strong> العمولات</li>
              </ul>

              <h5>مصروفات المركبات (5102XX):</h5>
              <ul>
                <li><strong>510201:</strong> الوقود</li>
                <li><strong>510202:</strong> الصيانة والإصلاح</li>
                <li><strong>510203:</strong> قطع الغيار</li>
                <li><strong>510204:</strong> التأمين</li>
              </ul>

              <h5>المصروفات الإدارية (5103XX):</h5>
              <ul>
                <li><strong>510301:</strong> الإيجارات</li>
                <li><strong>510302:</strong> الكهرباء والماء</li>
                <li><strong>510303:</strong> الهاتف والإنترنت</li>
                <li><strong>510304:</strong> القرطاسية واللوازم المكتبية</li>
              </ul>

              <h5>الإهلاك (5104XX):</h5>
              <ul>
                <li><strong>510402:</strong> إهلاك المركبات</li>
                <li><strong>510403:</strong> إهلاك المعدات</li>
                <li><strong>510404:</strong> إهلاك الأثاث</li>
              </ul>
            </div>
          </section>

          <section id="journal-entries">
            <h2>القيود المحاسبية</h2>
            
            <div class="entries-section">
              <h3>1. قيود العقود</h3>
              
              <h4>عند إنشاء العقد (للأفراد):</h4>
              <div class="entry-example">
                <pre>
من حـ/ عملاء - أفراد (110201)          XXX
    إلى حـ/ إيراد تأجير سيارات يومي (410101)  XXX
                </pre>
              </div>

              <h4>عند الدفع نقداً:</h4>
              <div class="entry-example">
                <pre>
من حـ/ النقدية في الصندوق (110101)    XXX
    إلى حـ/ عملاء - أفراد (110201)       XXX
                </pre>
              </div>

              <h4>عند الدفع بالتحويل البنكي:</h4>
              <div class="entry-example">
                <pre>
من حـ/ بنك الكويت الوطني (110103)    XXX
    إلى حـ/ عملاء - أفراد (110201)       XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>2. قيود الرواتب</h3>
              
              <h4>راتب شهري:</h4>
              <div class="entry-example">
                <pre>
من حـ/ رواتب الموظفين (510102)       XXX
من حـ/ رواتب الإدارة (510101)        XXX
    إلى حـ/ مستحقات الرواتب (210201)     XXX
    إلى حـ/ مستحقات ضريبية (210203)     XXX
                </pre>
              </div>

              <h4>عند دفع الرواتب:</h4>
              <div class="entry-example">
                <pre>
من حـ/ مستحقات الرواتب (210201)     XXX
    إلى حـ/ النقدية في الصندوق (110101)   XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>3. قيود المصروفات</h3>
              
              <h4>عند دفع مصروفات الوقود:</h4>
              <div class="entry-example">
                <pre>
من حـ/ الوقود (510201)              XXX
    إلى حـ/ النقدية في الصندوق (110101)   XXX
                </pre>
              </div>

              <h4>عند دفع مصروفات الصيانة:</h4>
              <div class="entry-example">
                <pre>
من حـ/ الصيانة والإصلاح (510202)     XXX
    إلى حـ/ النقدية في الصندوق (110101)   XXX
                </pre>
              </div>
            </div>

            <div class="entries-section">
              <h3>4. قيود الإهلاك</h3>
              
              <h4>إهلاك شهري للمركبات:</h4>
              <div class="entry-example">
                <pre>
من حـ/ إهلاك المركبات (510402)      XXX
    إلى حـ/ مجمع إهلاك المركبات (120304)  XXX
                </pre>
              </div>

              <h4>إهلاك المعدات:</h4>
              <div class="entry-example">
                <pre>
من حـ/ إهلاك المعدات (510403)       XXX
    إلى حـ/ مجمع إهلاك المعدات (120203)   XXX
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