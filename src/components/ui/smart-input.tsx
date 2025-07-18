import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Wand2, 
  RefreshCw,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import {
  getContextualSuggestions,
  generateStrongPassword,
  generateReadablePassword,
  analyzePasswordStrength
} from '@/utils/smartSuggestions';

interface SmartInputProps {
  label: string;
  field: string;
  type?: string;
  placeholder: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  formData?: any;
  error?: string;
  isPassword?: boolean;
  required?: boolean;
  showSuggestions?: boolean;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  label,
  field,
  type = 'text',
  placeholder,
  description,
  value,
  onChange,
  formData = {},
  error,
  isPassword = false,
  required = false,
  showSuggestions = true
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAnalysis, setPasswordAnalysis] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isValid = value && !error;
  const isInvalid = value && error;

  // تحديث الاقتراحات عند تغيير القيمة
  useEffect(() => {
    if (showSuggestions && value && field !== 'adminPassword' && field !== 'confirmPassword') {
      const newSuggestions = getContextualSuggestions(field, value, formData);
      setSuggestions(newSuggestions);
      setShowSuggestionsList(newSuggestions.length > 0);
    } else {
      setShowSuggestionsList(false);
    }
  }, [value, field, formData, showSuggestions]);

  // تحليل كلمة المرور
  useEffect(() => {
    if ((field === 'adminPassword') && value) {
      setPasswordAnalysis(analyzePasswordStrength(value));
    }
  }, [value, field]);

  // إخفاء الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  };

  const generatePassword = (readable: boolean = false) => {
    const newPassword = readable ? generateReadablePassword() : generateStrongPassword();
    onChange(newPassword);
    setShowPassword(true);
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative">
      <Label htmlFor={field} className="flex items-center gap-2 mb-2">
        {label}
        {required && <span className="text-red-500 text-sm">*</span>}
        {isValid && <CheckCircle className="w-4 h-4 text-green-500" />}
        {isInvalid && <span className="w-4 h-4 text-red-500 text-sm">✗</span>}
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id={field}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          placeholder={placeholder}
          className={`${
            isValid ? 'border-green-500 bg-green-50/50' : 
            isInvalid ? 'border-destructive bg-red-50/50' : ''
          } transition-colors ${isPassword ? 'pr-20' : ''}`}
        />

        {/* أزرار كلمة المرور */}
        {isPassword && (
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            
            {field === 'adminPassword' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => generatePassword(false)}
                  title="توليد كلمة مرور قوية"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => generatePassword(true)}
                  title="توليد كلمة مرور سهلة التذكر"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* مؤشر الاقتراحات */}
        {showSuggestions && suggestions.length > 0 && !showSuggestionsList && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setShowSuggestionsList(true)}
            title="عرض الاقتراحات"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* قائمة الاقتراحات */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div className="p-2 text-xs text-muted-foreground border-b flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            اقتراحات ذكية
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-right px-3 py-2 hover:bg-gray-50 transition-colors text-sm border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* تحليل كلمة المرور */}
      {field === 'adminPassword' && value && passwordAnalysis && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${passwordAnalysis.color}`}
                style={{ width: `${passwordAnalysis.score}%` }}
              ></div>
            </div>
            <span className={`text-xs font-medium ${
              passwordAnalysis.score >= 75 ? 'text-green-600' :
              passwordAnalysis.score >= 50 ? 'text-yellow-600' :
              passwordAnalysis.score >= 25 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {passwordAnalysis.level}
            </span>
          </div>
          
          {passwordAnalysis.feedback.length > 0 && (
            <p className="text-xs text-muted-foreground">
              المطلوب: {passwordAnalysis.feedback.join(' • ')}
            </p>
          )}
          
          {passwordAnalysis.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {passwordAnalysis.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  💡 {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* وصف الحقل */}
      {description && !error && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}

      {/* رسالة النجاح */}
      {isValid && (
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          ممتاز!
        </p>
      )}
    </div>
  );
}; 