import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Send, 
  HelpCircle, 
  Phone, 
  Mail, 
  ExternalLink,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  helpful?: boolean;
}

interface HelpSystemProps {
  currentStep?: number;
  context?: string;
}

const FAQ_DATA = [
  {
    question: "ما هي مدة التجربة المجانية؟",
    answer: "نوفر تجربة مجانية كاملة لمدة 14 يوماً بدون الحاجة لبطاقة ائتمان. يمكنك إلغاء الاشتراك في أي وقت.",
    step: 1
  },
  {
    question: "هل يمكنني تغيير خطة الاشتراك لاحقاً؟",
    answer: "نعم، يمكنك ترقية أو تقليل خطتك في أي وقت من لوحة التحكم. التغييرات تسري من الفاتورة التالية.",
    step: 1
  },
  {
    question: "ما هي البيانات المطلوبة لإنشاء الحساب؟",
    answer: "نحتاج اسم الشركة، بريد إلكتروني، ومعلومات المدير الأساسية. البيانات الأخرى اختيارية.",
    step: 2
  },
  {
    question: "هل بياناتي آمنة؟",
    answer: "نعم، جميع البيانات محمية بتشفير SSL 256-bit ونتبع معايير الأمان الدولية GDPR.",
    step: 3
  },
  {
    question: "كيف يتم الدفع؟",
    answer: "نستخدم بوابة SADAD الآمنة للدفع. ندعم جميع البطاقات الائتمانية والتحويل البنكي.",
    step: 4
  }
];

const QUICK_RESPONSES = [
  "شكراً لك! هذا مفيد جداً 👍",
  "أحتاج مساعدة في اختيار الخطة المناسبة",
  "لديي مشكلة في كلمة المرور",
  "كيف يمكنني التواصل مع الدعم الفني؟",
  "أريد معرفة المزيد عن الأسعار"
];

export const HelpSystem: React.FC<HelpSystemProps> = ({ 
  currentStep = 1, 
  context = 'registration' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ 😊',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // البحث في الأسئلة الشائعة
    const faqMatch = FAQ_DATA.find(faq => 
      faq.question.toLowerCase().includes(message) ||
      message.includes(faq.question.toLowerCase().substring(0, 10))
    );
    
    if (faqMatch) {
      return faqMatch.answer;
    }

    // ردود مخصصة حسب الكلمات المفتاحية
    if (message.includes('خطة') || message.includes('باقة') || message.includes('سعر')) {
      return 'يمكنني مساعدتك في اختيار الخطة المناسبة! نحن نوفر 4 خطط مختلفة. هل تريد أن أوصي لك بخطة بناءً على احتياجاتك؟ يمكنك أيضاً استخدام "احصل على توصية ذكية" في صفحة اختيار الخطط.';
    }
    
    if (message.includes('كلمة المرور') || message.includes('باسورد')) {
      return 'لإنشاء كلمة مرور قوية، استخدم مزيج من الأحرف الكبيرة والصغيرة والأرقام والرموز. يمكنك استخدام مولد كلمات المرور في النموذج بالنقر على أيقونة العصا السحرية ⚡';
    }
    
    if (message.includes('دعم') || message.includes('مساعدة') || message.includes('تواصل')) {
      return 'يمكنك التواصل معنا عبر:\n📧 البريد: support@fleetify.com\n📞 الهاتف: +965 1234 5678\n⏰ ساعات العمل: 8 صباحاً - 6 مساءً (السبت - الخميس)';
    }
    
    if (message.includes('تجربة') || message.includes('مجاني')) {
      return 'نوفر تجربة مجانية كاملة لمدة 14 يوماً! لا نحتاج بطاقة ائتمان للبدء، ويمكنك الإلغاء في أي وقت بدون رسوم. التجربة تشمل جميع المميزات الأساسية.';
    }

    // رد افتراضي
    return 'شكراً لسؤالك! للحصول على مساعدة مفصلة، يمكنك التواصل مع فريق الدعم أو تصفح الأسئلة الشائعة. هل يمكنني مساعدتك في شيء محدد؟';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // محاكاة تأخير الرد
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const sendQuickResponse = (response: string) => {
    setInputMessage(response);
  };

  const markAsHelpful = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful } : msg
    ));
  };

  const getContextualFAQ = () => {
    return FAQ_DATA.filter(faq => faq.step === currentStep || faq.step === 0);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-12' : 'w-96 h-[500px]'
    }`}>
      <Card className="w-full h-full shadow-2xl border-0">
        <CardHeader className="p-3 bg-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">مساعد Fleetify</CardTitle>
                <p className="text-xs opacity-80">متاح دائماً للمساعدة</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-72px)]">
            {/* منطقة الرسائل */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-start gap-2">
                        {message.sender === 'bot' && (
                          <Bot className="w-4 h-4 mt-0.5 text-primary" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString('ar-KW', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <User className="w-4 h-4 mt-0.5" />
                        )}
                      </div>
                      
                      {/* تقييم الرد */}
                      {message.sender === 'bot' && message.helpful === undefined && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs">هل كان هذا مفيداً؟</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsHelpful(message.id, true)}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsHelpful(message.id, false)}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* مؤشر الكتابة */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* الردود السريعة */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex flex-wrap gap-1 mb-2">
                {QUICK_RESPONSES.slice(0, 3).map((response, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendQuickResponse(response)}
                    className="text-xs h-6 px-2"
                  >
                    {response.length > 20 ? response.substring(0, 20) + '...' : response}
                  </Button>
                ))}
              </div>
            </div>

            {/* منطقة الإدخال */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm" disabled={!inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* روابط سريعة */}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                <a href="tel:+96512345678" className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="w-3 h-3" />
                  اتصل بنا
                </a>
                <a href="mailto:support@fleetify.com" className="flex items-center gap-1 text-primary hover:underline">
                  <Mail className="w-3 h-3" />
                  راسلنا
                </a>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}; 