import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle,
  ChevronRight,
  Search,
  Star,
  Play
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'guide' | 'video' | 'faq';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  rating: number;
  views: number;
}

interface FinancialInteractiveHelpProps {
  className?: string;
}

export const FinancialInteractiveHelp: React.FC<FinancialInteractiveHelpProps> = ({ 
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const helpTopics: HelpTopic[] = [
    {
      id: '1',
      title: 'كيفية إنشاء قيد محاسبي',
      description: 'تعلم خطوات إنشاء القيود المحاسبية بطريقة صحيحة',
      type: 'tutorial',
      difficulty: 'beginner',
      duration: '5 دقائق',
      rating: 4.8,
      views: 1250
    },
    {
      id: '2',
      title: 'إعداد التقارير المالية',
      description: 'دليل شامل لإعداد التقارير المالية الدورية',
      type: 'guide',
      difficulty: 'intermediate',
      duration: '15 دقيقة',
      rating: 4.6,
      views: 890
    },
    {
      id: '3',
      title: 'استخدام لوحة المعلومات المالية',
      description: 'جولة تفاعلية في لوحة المعلومات وميزاتها',
      type: 'video',
      difficulty: 'beginner',
      duration: '8 دقائق',
      rating: 4.9,
      views: 2100
    },
    {
      id: '4',
      title: 'تسوية الحسابات المصرفية',
      description: 'كيفية تسوية البيانات المصرفية مع السجلات المحاسبية',
      type: 'tutorial',
      difficulty: 'advanced',
      duration: '20 دقيقة',
      rating: 4.7,
      views: 650
    },
    {
      id: '5',
      title: 'الأسئلة الشائعة حول الضرائب',
      description: 'إجابات على أكثر الأسئلة شيوعاً حول الحسابات الضريبية',
      type: 'faq',
      difficulty: 'intermediate',
      rating: 4.5,
      views: 1100
    },
    {
      id: '6',
      title: 'تحليل الأداء المالي',
      description: 'تعلم كيفية قراءة وتحليل المؤشرات المالية',
      type: 'video',
      difficulty: 'advanced',
      duration: '25 دقيقة',
      rating: 4.8,
      views: 780
    }
  ];

  const categories = [
    { id: 'all', name: 'الكل', count: helpTopics.length },
    { id: 'tutorial', name: 'دروس تفاعلية', count: helpTopics.filter(t => t.type === 'tutorial').length },
    { id: 'guide', name: 'أدلة', count: helpTopics.filter(t => t.type === 'guide').length },
    { id: 'video', name: 'فيديوهات', count: helpTopics.filter(t => t.type === 'video').length },
    { id: 'faq', name: 'أسئلة شائعة', count: helpTopics.filter(t => t.type === 'faq').length }
  ];

  const getTypeIcon = (type: HelpTopic['type']) => {
    switch (type) {
      case 'tutorial': return BookOpen;
      case 'guide': return HelpCircle;
      case 'video': return Video;
      case 'faq': return MessageCircle;
      default: return HelpCircle;
    }
  };

  const getTypeLabel = (type: HelpTopic['type']) => {
    switch (type) {
      case 'tutorial': return 'درس تفاعلي';
      case 'guide': return 'دليل';
      case 'video': return 'فيديو';
      case 'faq': return 'سؤال شائع';
      default: return 'مساعدة';
    }
  };

  const getDifficultyColor = (difficulty: HelpTopic['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: HelpTopic['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  };

  const filteredTopics = helpTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          المساعدة التفاعلية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في مواضيع المساعدة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* تصنيفات المساعدة */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="gap-2"
            >
              {category.name}
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* قائمة مواضيع المساعدة */}
        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const TypeIcon = getTypeIcon(topic.type);
            
            return (
              <div
                key={topic.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <TypeIcon className="w-5 h-5 mt-0.5 text-primary" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{topic.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(topic.type)}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(topic.difficulty)}`} />
                        <span className="text-xs text-muted-foreground">
                          {getDifficultyLabel(topic.difficulty)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {topic.duration && (
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {topic.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {topic.rating}
                        </span>
                        <span>{topic.views.toLocaleString()} مشاهدة</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>لم يتم العثور على مواضيع مساعدة مطابقة</p>
          </div>
        )}

        {/* أزرار المساعدة السريعة */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            الدعم المباشر
          </Button>
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            دليل المستخدم
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};