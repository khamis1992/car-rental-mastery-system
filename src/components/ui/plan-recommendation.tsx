import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  Car, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  Target,
  CheckCircle,
  Zap,
  Crown,
  Star,
  Building
} from 'lucide-react';

interface QuestionOption {
  id: string;
  label: string;
  value: number;
  description?: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  options: QuestionOption[];
  icon: React.ComponentType<any>;
}

const questions: Question[] = [
  {
    id: 'company_size',
    title: 'ما حجم شركتك؟',
    description: 'عدد الموظفين في شركتك حالياً',
    icon: Building2,
    options: [
      { id: 'small', label: '1-10 موظفين', value: 1, description: 'شركة صغيرة أو ناشئة' },
      { id: 'medium', label: '11-50 موظف', value: 2, description: 'شركة متوسطة الحجم' },
      { id: 'large', label: '51-200 موظف', value: 3, description: 'شركة كبيرة' },
      { id: 'enterprise', label: '200+ موظف', value: 4, description: 'مؤسسة كبيرة' }
    ]
  },
  {
    id: 'fleet_size',
    title: 'كم عدد المركبات في أسطولك؟',
    description: 'العدد الحالي أو المتوقع للمركبات',
    icon: Car,
    options: [
      { id: 'few', label: '1-20 مركبة', value: 1, description: 'أسطول صغير' },
      { id: 'medium', label: '21-100 مركبة', value: 2, description: 'أسطول متوسط' },
      { id: 'large', label: '101-500 مركبة', value: 3, description: 'أسطول كبير' },
      { id: 'massive', label: '500+ مركبة', value: 4, description: 'أسطول ضخم' }
    ]
  },
  {
    id: 'monthly_contracts',
    title: 'كم عقد تتوقع شهرياً؟',
    description: 'العدد المتوقع للعقود الجديدة شهرياً',
    icon: FileText,
    options: [
      { id: 'low', label: '1-50 عقد', value: 1, description: 'حجم تعاملات صغير' },
      { id: 'medium', label: '51-200 عقد', value: 2, description: 'حجم تعاملات متوسط' },
      { id: 'high', label: '201-1000 عقد', value: 3, description: 'حجم تعاملات كبير' },
      { id: 'massive', label: '1000+ عقد', value: 4, description: 'حجم تعاملات ضخم' }
    ]
  },
  {
    id: 'team_size',
    title: 'كم شخص سيستخدم النظام؟',
    description: 'عدد المستخدمين المتوقع للنظام',
    icon: Users,
    options: [
      { id: 'small_team', label: '1-5 مستخدمين', value: 1, description: 'فريق صغير' },
      { id: 'medium_team', label: '6-20 مستخدم', value: 2, description: 'فريق متوسط' },
      { id: 'large_team', label: '21-100 مستخدم', value: 3, description: 'فريق كبير' },
      { id: 'enterprise_team', label: '100+ مستخدم', value: 4, description: 'فريق مؤسسي' }
    ]
  }
];

interface PlanRecommendationProps {
  onRecommendation: (planId: string) => void;
  onSkip: () => void;
  isOpen: boolean;
}

export const PlanRecommendation: React.FC<PlanRecommendationProps> = ({
  onRecommendation,
  onSkip,
  isOpen
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  if (!isOpen) return null;

  const handleAnswer = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // حساب التوصية
      calculateRecommendation(newAnswers);
    }
  };

  const calculateRecommendation = (finalAnswers: Record<string, number>) => {
    const totalScore = Object.values(finalAnswers).reduce((sum, value) => sum + value, 0);
    const averageScore = totalScore / Object.keys(finalAnswers).length;

    let recommendedPlan = 'basic';
    
    if (averageScore >= 3.5) {
      recommendedPlan = 'enterprise';
    } else if (averageScore >= 2.5) {
      recommendedPlan = 'premium';
    } else if (averageScore >= 1.5) {
      recommendedPlan = 'standard';
    }

    setShowResult(true);
    setTimeout(() => {
      onRecommendation(recommendedPlan);
    }, 2000);
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progress = ((currentQuestion + (Object.keys(answers).length > currentQuestion ? 1 : 0)) / questions.length) * 100;

  if (showResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Target className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">جاري تحليل احتياجاتك...</h3>
              <p className="text-muted-foreground">سنوصي لك بالخطة المثالية خلال ثوانِ</p>
            </div>
            <Progress value={100} className="h-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const QuestionIcon = question.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">مساعد اختيار الخطة</span>
            </div>
            <Badge variant="outline">
              {currentQuestion + 1} من {questions.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2 mb-4" />
          
          <div className="flex items-center gap-3 mb-2">
            <QuestionIcon className="w-8 h-8 text-primary" />
            <CardTitle className="text-xl">{question.title}</CardTitle>
          </div>
          <p className="text-muted-foreground">{question.description}</p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(question.id, option.value)}
                className="p-4 text-right border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="font-medium group-hover:text-primary">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div>
              {currentQuestion > 0 && (
                <Button variant="outline" onClick={goBack}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  السابق
                </Button>
              )}
            </div>

            <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
              تخطي وإختيار بنفسي
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 