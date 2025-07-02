import type { DamageArea } from './VehicleDiagramInteractive';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateDamage = (damage: DamageArea): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!damage.description || damage.description.trim().length === 0) {
    errors.push('وصف الضرر مطلوب');
  }

  if (damage.description && damage.description.trim().length < 5) {
    warnings.push('وصف الضرر قصير جداً، يفضل إضافة تفاصيل أكثر');
  }

  // Position validation
  if (damage.x < 0 || damage.x > 100) {
    errors.push('موقع الضرر خارج حدود المخطط (المحور الأفقي)');
  }

  if (damage.y < 0 || damage.y > 100) {
    errors.push('موقع الضرر خارج حدود المخطط (المحور العمودي)');
  }

  // Severity validation
  if (!['minor', 'major', 'critical'].includes(damage.severity)) {
    errors.push('مستوى الضرر غير صحيح');
  }

  // Critical damage validation
  if (damage.severity === 'critical' && (!damage.photos || damage.photos.length === 0)) {
    warnings.push('يُنصح بإضافة صور للأضرار الشديدة لتوثيقها بشكل أفضل');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateDamageList = (damages: DamageArea[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate positions (too close to each other)
  for (let i = 0; i < damages.length; i++) {
    for (let j = i + 1; j < damages.length; j++) {
      const distance = Math.sqrt(
        Math.pow(damages[i].x - damages[j].x, 2) + 
        Math.pow(damages[i].y - damages[j].y, 2)
      );
      
      if (distance < 5) { // Less than 5% distance
        warnings.push(`يوجد ضرران متقاربان جداً في الموقع - قد يكونا نفس الضرر`);
        break;
      }
    }
  }

  // Check for missing photos on critical damages
  const criticalWithoutPhotos = damages.filter(
    d => d.severity === 'critical' && (!d.photos || d.photos.length === 0)
  ).length;

  if (criticalWithoutPhotos > 0) {
    warnings.push(`${criticalWithoutPhotos} من الأضرار الشديدة بدون صور توثيقية`);
  }

  // Check for incomplete descriptions
  const incompleteDescriptions = damages.filter(
    d => !d.description || d.description.trim().length < 5
  ).length;

  if (incompleteDescriptions > 0) {
    warnings.push(`${incompleteDescriptions} من الأضرار لديها وصف غير مكتمل`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};