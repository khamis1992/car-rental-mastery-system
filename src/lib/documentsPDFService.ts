import jsPDF from 'jspdf';

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
}

export class DocumentsPDFService {
  private doc: jsPDF;
  private yPosition: number = 20;
  private readonly pageHeight: number = 297; // A4 height in mm
  private readonly marginTop: number = 20;
  private readonly marginBottom: number = 20;
  private readonly marginLeft: number = 20;
  private readonly marginRight: number = 20;
  private pageNumber: number = 1;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // إعداد الخط العربي
    this.setupArabicFont();
  }

  private setupArabicFont() {
    // استخدام خط افتراضي يدعم العربية
    this.doc.setFont('helvetica');
    this.doc.setFontSize(12);
  }

  private addHeader(title: string) {
    // خلفية الرأس
    this.doc.setFillColor(41, 98, 255); // لون أزرق
    this.doc.rect(0, 0, 210, 15, 'F'); // عرض كامل للصفحة
    
    // عنوان الوثيقة
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 105, 10, { align: 'center' });
    
    // معلومات الشركة
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('نظام إدارة تأجير المركبات - دولة الكويت', 105, 13, { align: 'center' });
    
    this.yPosition = 25;
  }

  private addFooter() {
    const footerY = this.pageHeight - 10;
    
    // خط فاصل
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.marginLeft, footerY - 5, 210 - this.marginRight, footerY - 5);
    
    // رقم الصفحة
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(8);
    this.doc.text(
      `صفحة ${this.pageNumber}`, 
      105, 
      footerY, 
      { align: 'center' }
    );
    
    // تاريخ الإنشاء
    const currentDate = new Date().toLocaleDateString('ar-KW');
    this.doc.text(
      `تاريخ الإنشاء: ${currentDate}`,
      210 - this.marginRight,
      footerY,
      { align: 'right' }
    );
  }

  private checkPageBreak(requiredSpace: number = 15) {
    if (this.yPosition + requiredSpace > this.pageHeight - this.marginBottom - 15) {
      this.addFooter();
      this.doc.addPage();
      this.pageNumber++;
      this.yPosition = this.marginTop;
    }
  }

  private addTitle(text: string, level: number = 1) {
    this.checkPageBreak(20);
    
    const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
    const fontStyle = level <= 2 ? 'bold' : 'normal';
    
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    
    // إضافة مسافة قبل العنوان
    if (level === 1) {
      this.yPosition += 10;
      // خلفية ملونة للعناوين الرئيسية
      this.doc.setFillColor(248, 249, 250);
      this.doc.rect(this.marginLeft - 5, this.yPosition - 7, 210 - this.marginLeft - this.marginRight + 10, 12, 'F');
    } else if (level === 2) {
      this.yPosition += 8;
    } else {
      this.yPosition += 6;
    }
    
    // رقم العنوان (للعناوين الرئيسية والفرعية)
    if (level <= 2) {
      const bulletSize = level === 1 ? 3 : 2;
      this.doc.setFillColor(41, 98, 255);
      this.doc.circle(210 - this.marginRight - 5, this.yPosition - 2, bulletSize, 'F');
    }
    
    this.doc.text(text, 210 - this.marginRight - 12, this.yPosition, { align: 'right' });
    this.yPosition += level === 1 ? 12 : level === 2 ? 10 : 8;
  }

  private addParagraph(text: string) {
    this.doc.setTextColor(73, 80, 87);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const maxWidth = 210 - this.marginLeft - this.marginRight - 10;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      this.checkPageBreak(8);
      this.doc.text(line, 210 - this.marginRight, this.yPosition, { align: 'right' });
      this.yPosition += 6;
    }
    
    this.yPosition += 4; // مسافة بعد الفقرة
  }

  private addBulletPoint(text: string) {
    this.checkPageBreak(8);
    
    this.doc.setTextColor(73, 80, 87);
    this.doc.setFontSize(11);
    
    // نقطة الترقيم
    this.doc.setFillColor(108, 117, 125);
    this.doc.circle(210 - this.marginRight - 5, this.yPosition - 2, 1.5, 'F');
    
    const maxWidth = 210 - this.marginLeft - this.marginRight - 15;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) this.checkPageBreak(6);
      this.doc.text(lines[i], 210 - this.marginRight - 10, this.yPosition, { align: 'right' });
      this.yPosition += 6;
    }
  }

  private addCodeBlock(text: string) {
    this.checkPageBreak(15);
    
    // خلفية رمادية للكود
    const codeHeight = Math.ceil(text.split('\n').length * 5) + 8;
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.marginLeft, this.yPosition - 4, 210 - this.marginLeft - this.marginRight, codeHeight, 'F');
    
    // إطار
    this.doc.setDrawColor(222, 226, 230);
    this.doc.rect(this.marginLeft, this.yPosition - 4, 210 - this.marginLeft - this.marginRight, codeHeight);
    
    this.doc.setTextColor(73, 80, 87);
    this.doc.setFontSize(9);
    this.doc.setFont('courier', 'normal');
    
    const lines = text.split('\n');
    for (const line of lines) {
      this.doc.text(line, this.marginLeft + 5, this.yPosition, { align: 'left' });
      this.yPosition += 5;
    }
    
    this.yPosition += 8;
    this.doc.setFont('helvetica', 'normal'); // العودة للخط العادي
  }

  private parseMarkdownContent(content: string) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        this.yPosition += 4;
        continue;
      }
      
      // العناوين
      if (line.startsWith('### ')) {
        this.addTitle(line.substring(4), 3);
      } else if (line.startsWith('## ')) {
        this.addTitle(line.substring(3), 2);
      } else if (line.startsWith('# ')) {
        this.addTitle(line.substring(2), 1);
      }
      // النقاط
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        this.addBulletPoint(line.substring(2));
      }
      // الأرقام
      else if (/^\d+\.\s/.test(line)) {
        this.addBulletPoint(line.replace(/^\d+\.\s/, ''));
      }
      // كتل الكود
      else if (line.startsWith('```')) {
        const codeLines = [];
        i++; // تخطي سطر البداية
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (codeLines.length > 0) {
          this.addCodeBlock(codeLines.join('\n'));
        }
      }
      // النص العادي
      else if (line && !line.startsWith('---')) {
        this.addParagraph(line);
      }
    }
  }

  public async generateUserManualPDF(): Promise<void> {
    // قراءة محتوى دليل المستخدم
    const userManualContent = await this.loadDocumentContent('user-manual');
    
    this.addHeader('دليل المستخدم - نظام إدارة تأجير المركبات');
    this.parseMarkdownContent(userManualContent);
    this.addFooter();
  }

  public async generateContractsGuidePDF(): Promise<void> {
    const contractsGuideContent = await this.loadDocumentContent('contracts-guide');
    
    this.addHeader('دليل إدارة العقود');
    this.parseMarkdownContent(contractsGuideContent);
    this.addFooter();
  }

  public async generateAccountingGuidePDF(): Promise<void> {
    const accountingGuideContent = await this.loadDocumentContent('accounting-guide');
    
    this.addHeader('دليل النظام المحاسبي');
    this.parseMarkdownContent(accountingGuideContent);
    this.addFooter();
  }

  public async generateTroubleshootingGuidePDF(): Promise<void> {
    const troubleshootingContent = await this.loadDocumentContent('troubleshooting-guide');
    
    this.addHeader('دليل استكشاف الأخطاء وحلها');
    this.parseMarkdownContent(troubleshootingContent);
    this.addFooter();
  }

  public async generateSetupGuidePDF(): Promise<void> {
    const setupGuideContent = await this.loadDocumentContent('setup-guide');
    
    this.addHeader('دليل الإعداد والتكوين');
    this.parseMarkdownContent(setupGuideContent);
    this.addFooter();
  }

  private async loadDocumentContent(docType: string): Promise<string> {
    // هنا يتم تحميل محتوى الوثيقة
    // في التطبيق الحقيقي، ستقوم بقراءة الملف من الخادم
    
    const documentContents: Record<string, string> = {
      'user-manual': `# دليل المستخدم - نظام إدارة تأجير المركبات

## نبذة عن النظام

نظام إدارة تأجير المركبات هو نظام شامل مصمم خصيصاً لدولة الكويت لإدارة جميع عمليات تأجير المركبات، المحاسبة، إدارة الموظفين، والعمليات التشغيلية.

## أدوار المستخدمين

### 1. المدير العام (Super Admin)
**الصلاحيات:**
- الوصول الكامل لجميع الوحدات
- إدارة المستخدمين والصلاحيات
- تكوين النظام
- عرض جميع التقارير
- اعتماد العمليات المالية

### 2. مدير المبيعات (Sales Manager)
**الصلاحيات:**
- إدارة العقود والعروض
- متابعة العملاء
- عرض تقارير المبيعات
- اعتماد الخصومات

### 3. المحاسب (Accountant)
**الصلاحيات:**
- الوصول الكامل للوحدة المحاسبية
- إدارة الفواتير والمدفوعات
- إعداد التقارير المالية
- مراجعة القيود المحاسبية

## العمليات الأساسية

### إنشاء عقد جديد
1. انتقل إلى "العقود" → "جديد"
2. اختر العميل أو أضف عميل جديد
3. اختر المركبة من القائمة المتاحة
4. حدد فترة الإيجار
5. أدخل تفاصيل التسعير
6. احفظ العقد

### تسليم المركبة
1. افتح العقد من قائمة "العقود النشطة"
2. تأكد من دفع العميل للمبلغ المطلوب
3. التقط صور حالة المركبة
4. أطلب من العميل التوقيع
5. اكمل عملية التسليم`,

      'contracts-guide': `# دليل إدارة العقود

## مراحل العقد

### 1. المسودة (Draft)
هذه المرحلة الأولى للعقد حيث يتم إدخال البيانات الأساسية.

**المطلوب:**
- اختيار العميل
- اختيار المركبة  
- تحديد فترة الإيجار
- إدخال تفاصيل التسعير

### 2. المعلقة (Pending)
العقود في انتظار الاعتماد من المدير.

### 3. النشطة (Active)
العقود المعتمدة والجاهزة للتنفيذ.

### 4. المكتملة (Completed)
العقود المنتهية وتم استقبال المركبة.

## إنشاء عقد جديد

### الخطوة 1: البيانات الأساسية
1. **اختيار العميل:**
   - ابحث عن العميل بالاسم أو رقم الهوية
   - إذا لم يكن موجود، انقر "إضافة عميل جديد"

2. **اختيار المركبة:**
   - اعرض المركبات المتاحة في الفترة المطلوبة
   - استخدم المرشحات

### الخطوة 2: التسعير
1. **السعر الأساسي:**
   - السعر اليومي × عدد الأيام

2. **الخصومات:**
   - خصم نسبة مئوية
   - خصم مبلغ ثابت`,

      'accounting-guide': `# دليل النظام المحاسبي

## دليل الحسابات

### هيكل الحسابات

#### 1. الأصول (Assets) - 1XXXXX
**الأصول المتداولة (11XXXX):**

**النقدية والبنوك (1101XX):**
- 110101: النقدية في الصندوق
- 110102: البنك التجاري الكويتي
- 110103: بنك الكويت الوطني
- 110104: بيت التمويل الكويتي
- 110105: بنك الخليج

**الحسابات المدينة (1102XX):**
- 110201: عملاء - أفراد
- 110202: عملاء - شركات
- 110203: عملاء - جهات حكومية
- 110204: أوراق القبض
- 110205: مخصص الديون المشكوك فيها

**الأصول الثابتة (12XXXX):**
- 120301: سيارات الأجرة
- 120302: الحافلات  
- 120303: الشاحنات
- 120304: مجمع إهلاك المركبات

#### 2. الخصوم (Liabilities) - 2XXXXX
**الخصوم المتداولة (21XXXX):**
- 210201: مستحقات الرواتب
- 210203: مستحقات ضريبية
- 210101: موردون

#### 3. حقوق الملكية (Equity) - 3XXXXX
- 3101: رأس المال المدفوع
- 3201: الاحتياطي القانوني
- 3301: أرباح مرحلة من سنوات سابقة

#### 4. الإيرادات (Revenue) - 4XXXXX
- 410101: إيراد تأجير سيارات يومي
- 410102: إيراد تأجير سيارات أسبوعي
- 410103: إيراد تأجير سيارات شهري
- 4201: إيرادات التوصيل والاستلام

#### 5. المصروفات (Expenses) - 5XXXXX
- 510101: رواتب الإدارة
- 510102: رواتب الموظفين
- 510201: الوقود
- 510202: الصيانة والإصلاح
- 510402: إهلاك المركبات

## القيود المحاسبية

### قيود العقود
**عند إنشاء العقد (للأفراد):**
\`\`\`
من حـ/ عملاء - أفراد (110201)          XXX
    إلى حـ/ إيراد تأجير سيارات يومي (410101)  XXX
\`\`\`

**عند الدفع نقداً:**
\`\`\`
من حـ/ النقدية في الصندوق (110101)    XXX
    إلى حـ/ عملاء - أفراد (110201)       XXX
\`\`\``,

      'troubleshooting-guide': `# دليل استكشاف الأخطاء

## مشاكل تسجيل الدخول

### لا يمكن تسجيل الدخول

**الأعراض:**
- رسالة خطأ "اسم المستخدم أو كلمة المرور خاطئة"
- عدم استجابة زر تسجيل الدخول

**الحلول:**
1. **تحقق من البيانات:**
   - تأكد من صحة اسم المستخدم
   - تأكد من صحة كلمة المرور
   - انتبه لحالة الأحرف

2. **مسح ذاكرة المتصفح:**
   - اضغط Ctrl+Shift+Delete
   - اختر "ذاكرة التخزين المؤقت"
   - انقر "مسح البيانات"

## مشاكل الأداء

### النظام بطيء
**الحلول:**
1. **تحسين المتصفح:**
   - أغلق التبويبات غير المستخدمة
   - أعد تشغيل المتصفح

2. **تحقق من الإنترنت:**
   - قس سرعة الإنترنت
   - تأكد من استقرار الاتصال

## مشاكل الطباعة

### لا تعمل الطباعة
**الحلول:**
1. **إعدادات المتصفح:**
   - تأكد من السماح للموقع بالطباعة
   - تحقق من إعدادات النوافذ المنبثقة

2. **إعدادات الطابعة:**
   - تأكد من تشغيل الطابعة
   - تحقق من توفر الورق والحبر`,

      'setup-guide': `# دليل الإعداد والتكوين

## متطلبات النظام

### متطلبات المتصفح
**المتصفحات المدعومة:**
- Google Chrome (الإصدار 90 أو أحدث) - مُوصى به
- Mozilla Firefox (الإصدار 88 أو أحدث)
- Microsoft Edge (الإصدار 90 أو أحدث)

### متطلبات الجهاز
**الحد الأدنى:**
- ذاكرة الوصول العشوائي: 4 جيجابايت
- مساحة القرص الصلب: 1 جيجابايت متاح
- دقة الشاشة: 1024×768 بكسل

## الإعداد الأولي للنظام

### 1. تكوين الشركة
**البيانات الأساسية:**
1. انتقل إلى "الإعدادات" → "بيانات الشركة"
2. أدخل المعلومات التالية:
   - اسم الشركة (عربي وإنجليزي)
   - العنوان الكامل
   - أرقام الهواتف

### 2. إعداد الفروع والمواقع
**إضافة فرع جديد:**
1. انتقل إلى "الإعدادات" → "الفروع"
2. انقر "إضافة فرع جديد"
3. أدخل البيانات المطلوبة

### 3. إعداد أدوار المستخدمين
**الأدوار الافتراضية:**
- مدير عام: صلاحية كاملة
- مدير مبيعات: العقود والعملاء
- محاسب: المحاسبة والتقارير المالية`
    };

    return documentContents[docType] || '';
  }

  public downloadPDF(filename: string) {
    this.doc.save(`${filename}.pdf`);
  }

  // طريقة مساعدة لإنشاء جميع الأدلة
  public async generateAllGuides() {
    const guides = [
      { name: 'user-manual', title: 'دليل المستخدم', method: 'generateUserManualPDF' },
      { name: 'contracts-guide', title: 'دليل إدارة العقود', method: 'generateContractsGuidePDF' },
      { name: 'accounting-guide', title: 'دليل النظام المحاسبي', method: 'generateAccountingGuidePDF' },
      { name: 'troubleshooting-guide', title: 'دليل استكشاف الأخطاء', method: 'generateTroubleshootingGuidePDF' },
      { name: 'setup-guide', title: 'دليل الإعداد والتكوين', method: 'generateSetupGuidePDF' }
    ];

    return guides;
  }
}