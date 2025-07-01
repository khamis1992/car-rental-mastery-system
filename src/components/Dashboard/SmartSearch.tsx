import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, User, Car, FileText, Calendar, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  type: 'customer' | 'vehicle' | 'contract';
  title: string;
  subtitle: string;
  details: string;
  icon: React.ReactNode;
  data: any;
}

const SmartSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, customer_number, email')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,customer_number.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      customers?.forEach(customer => {
        searchResults.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.customer_number,
          details: customer.phone || customer.email || '',
          icon: <User className="w-4 h-4" />,
          data: customer
        });
      });

      // Search vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, vehicle_number, license_plate, status')
        .or(`make.ilike.%${query}%,model.ilike.%${query}%,vehicle_number.ilike.%${query}%,license_plate.ilike.%${query}%`)
        .limit(5);

      vehicles?.forEach(vehicle => {
        searchResults.push({
          id: vehicle.id,
          type: 'vehicle',
          title: `${vehicle.make} ${vehicle.model}`,
          subtitle: vehicle.vehicle_number,
          details: `${vehicle.license_plate} • ${vehicle.status}`,
          icon: <Car className="w-4 h-4" />,
          data: vehicle
        });
      });

      // Search contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          id, contract_number, status, start_date, end_date,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .or(`contract_number.ilike.%${query}%`)
        .limit(5);

      contracts?.forEach(contract => {
        searchResults.push({
          id: contract.id,
          type: 'contract',
          title: contract.contract_number,
          subtitle: contract.customers?.name || '',
          details: `${contract.vehicles?.make} ${contract.vehicles?.model} • ${contract.status}`,
          icon: <FileText className="w-4 h-4" />,
          data: contract
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    setIsOpen(false);
    // TODO: Navigate to the appropriate page based on result type
    console.log('Navigate to:', result);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'عميل';
      case 'vehicle': return 'مركبة';
      case 'contract': return 'عقد';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-500 text-white';
      case 'vehicle': return 'bg-green-500 text-white';
      case 'contract': return 'bg-purple-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-elegant">
      <CardContent className="p-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في العملاء، المركبات، والعقود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12"
                onFocus={() => setIsOpen(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="البحث..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0"
              />
              <CommandList>
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    جاري البحث...
                  </div>
                ) : (
                  <>
                    {results.length > 0 ? (
                      <CommandGroup heading="نتائج البحث">
                        {results.map((result) => (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            onSelect={() => handleResultClick(result)}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="bg-primary/10 p-2 rounded-lg">
                              {result.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{result.title}</span>
                                <Badge className={getTypeColor(result.type)}>
                                  {getTypeLabel(result.type)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {result.subtitle}
                              </div>
                              {result.details && (
                                <div className="text-xs text-muted-foreground">
                                  {result.details}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : searchQuery.length >= 2 ? (
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    ) : null}

                    {recentSearches.length > 0 && searchQuery.length < 2 && (
                      <CommandGroup heading="عمليات البحث الأخيرة">
                        {recentSearches.map((search, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => setSearchQuery(search)}
                            className="flex items-center gap-3 p-3"
                          >
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <span>{search}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
};

export default SmartSearch;