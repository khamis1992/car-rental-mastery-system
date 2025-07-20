import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journalEntryReviewService, ReviewDecisionData } from "@/services/journalEntryReviewService";

interface JournalEntryReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: {
    id: string;
    journal_entry_id: string;
    journal_entry?: {
      entry_number: string;
      description: string;
      total_debit: number;
      total_credit: number;
      entry_date: string;
    };
    required_documents: string[];
    review_checklist: Record<string, boolean>;
  } | null;
  onReviewSubmitted?: () => void;
}

export function JournalEntryReviewDialog({
  open,
  onOpenChange,
  review,
  onReviewSubmitted
}: JournalEntryReviewDialogProps) {
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [comments, setComments] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // تحديث القائمة المرجعية عند تغيير المراجعة
  useEffect(() => {
    if (review?.review_checklist) {
      setChecklist(review.review_checklist);
    }
  }, [review]);

  const handleChecklistChange = (item: string, checked: boolean) => {
    setChecklist(prev => ({
      ...prev,
      [item]: checked
    }));
  };

  const handleSubmitReview = async () => {
    if (!reviewStatus) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار حالة المراجعة",
        variant: "destructive"
      });
      return;
    }

    if (!review) return;

    setIsSubmitting(true);
    try {
      const decisionData: ReviewDecisionData = {
        review_status: reviewStatus as 'approved' | 'rejected' | 'needs_revision',
        review_comments: comments,
        missing_documents: []
      };

      await journalEntryReviewService.submitReviewDecision(review.id, decisionData);

      toast({
        title: "تم بنجاح",
        description: "تم حفظ نتيجة المراجعة بنجاح"
      });

      onReviewSubmitted?.();
      onOpenChange(false);
      
      // إعادة تعيين النموذج
      setReviewStatus("");
      setComments("");
      setChecklist({});
    } catch (error) {
      console.error("خطأ في حفظ المراجعة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المراجعة",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!review) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'needs_revision':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const checklistItems = [
    "التحقق من صحة الحسابات المستخدمة",
    "التأكد من توازن المبالغ المدينة والدائنة",
    "مراجعة الوثائق المطلوبة",
    "التحقق من صحة التاريخ والوصف",
    "مراجعة مراكز التكلفة إن وجدت"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">
            <FileText className="h-5 w-5 ml-2" />
            مراجعة القيد المحاسبي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات القيد */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات القيد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رقم القيد</Label>
                  <p className="font-semibold">{review.journal_entry?.entry_number}</p>
                </div>
                <div>
                  <Label>تاريخ القيد</Label>
                  <p>{review.journal_entry?.entry_date}</p>
                </div>
              </div>
              <div>
                <Label>الوصف</Label>
                <p>{review.journal_entry?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>إجمالي المدين</Label>
                  <p className="font-semibold text-green-600">
                    {review.journal_entry?.total_debit?.toLocaleString()} د.ك
                  </p>
                </div>
                <div>
                  <Label>إجمالي الدائن</Label>
                  <p className="font-semibold text-blue-600">
                    {review.journal_entry?.total_credit?.toLocaleString()} د.ك
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة المراجعة */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المراجعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id={`checklist-${index}`}
                      checked={checklist[item] || false}
                      onChange={(e) => handleChecklistChange(item, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`checklist-${index}`} className="text-sm">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* المستندات المطلوبة */}
          {review.required_documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المستندات المطلوبة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {review.required_documents.map((doc, index) => (
                    <Badge key={index} variant="outline">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* قرار المراجعة */}
          <Card>
            <CardHeader>
              <CardTitle>قرار المراجعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={reviewStatus} onValueChange={setReviewStatus}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="approved" id="approved" />
                  <Label htmlFor="approved" className="rtl-flex">
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                    موافق
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="needs_revision" id="needs_revision" />
                  <Label htmlFor="needs_revision" className="rtl-flex">
                    <AlertCircle className="h-4 w-4 text-yellow-500 ml-2" />
                    يحتاج مراجعة
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="rtl-flex">
                    <XCircle className="h-4 w-4 text-red-500 ml-2" />
                    مرفوض
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label htmlFor="comments">تعليقات المراجعة</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="أدخل تعليقاتك على المراجعة..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmitReview}
            disabled={isSubmitting || !reviewStatus}
            className="rtl-flex"
          >
            {getStatusIcon(reviewStatus)}
            {isSubmitting ? "جاري الحفظ..." : "حفظ المراجعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}