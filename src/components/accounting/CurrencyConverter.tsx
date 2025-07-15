import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExchangeRate {
  currency: string;
  rate: number;
  lastUpdated: string;
}

export const CurrencyConverter = () => {
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("KWD");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [exchangeRates] = useState<ExchangeRate[]>([
    { currency: "USD", rate: 3.27, lastUpdated: "2024-01-15T10:00:00Z" },
    { currency: "EUR", rate: 3.58, lastUpdated: "2024-01-15T10:00:00Z" },
    { currency: "SAR", rate: 0.87, lastUpdated: "2024-01-15T10:00:00Z" },
    { currency: "AED", rate: 0.89, lastUpdated: "2024-01-15T10:00:00Z" },
    { currency: "GBP", rate: 4.15, lastUpdated: "2024-01-15T10:00:00Z" },
  ]);

  const currencies = [
    { code: "KWD", name: "دينار كويتي", symbol: "د.ك" },
    { code: "USD", name: "دولار أمريكي", symbol: "$" },
    { code: "EUR", name: "يورو", symbol: "€" },
    { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
    { code: "GBP", name: "جنيه استرليني", symbol: "£" },
  ];

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    
    if (from === "KWD") {
      const rate = exchangeRates.find(r => r.currency === to);
      return rate ? rate.rate : 1;
    }
    
    if (to === "KWD") {
      const rate = exchangeRates.find(r => r.currency === from);
      return rate ? 1 / rate.rate : 1;
    }
    
    // Cross conversion through KWD
    const fromRate = exchangeRates.find(r => r.currency === from);
    const toRate = exchangeRates.find(r => r.currency === to);
    
    if (fromRate && toRate) {
      return toRate.rate / fromRate.rate;
    }
    
    return 1;
  };

  const convertCurrency = () => {
    setLoading(true);
    const numAmount = parseFloat(amount) || 0;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    const result = numAmount * rate;
    
    setTimeout(() => {
      setConvertedAmount(result);
      setLoading(false);
    }, 500);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const updateRates = () => {
    setLoading(true);
    // Simulate API call to update rates
    setTimeout(() => {
      setLoading(false);
      // Here you would fetch real rates from an API
    }, 1000);
  };

  useEffect(() => {
    convertCurrency();
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="space-y-6">
      <Card className="rtl-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">محول العملات</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={updateRates}
              disabled={loading}
              className="rtl-button"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث الأسعار
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="rtl-label">المبلغ</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="rtl-label">من</label>
              <div className="flex items-center gap-2">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{currency.symbol}</span>
                          <span>{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={swapCurrencies}
                  className="shrink-0"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="rtl-label">إلى</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">
              {getCurrencySymbol(toCurrency)} {convertedAmount.toLocaleString('ar-KW', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              سعر الصرف: 1 {getCurrencySymbol(fromCurrency)} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {getCurrencySymbol(toCurrency)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rtl-card">
        <CardHeader>
          <CardTitle className="rtl-title">أسعار الصرف الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exchangeRates.map((rate) => (
              <div key={rate.currency} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg">{getCurrencySymbol(rate.currency)}</span>
                  <div>
                    <div className="font-medium">
                      {currencies.find(c => c.code === rate.currency)?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      آخر تحديث: {new Date(rate.lastUpdated).toLocaleString('ar-KW')}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold">
                    {rate.rate.toFixed(4)}
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 text-xs">
                    د.ك 1 = {getCurrencySymbol(rate.currency)} {rate.rate}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};