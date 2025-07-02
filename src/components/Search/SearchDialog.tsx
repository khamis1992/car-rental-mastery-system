import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/contexts/SearchContext';
import { 
  Users, 
  Car, 
  FileText, 
  Receipt, 
  UserCheck,
  Loader2
} from 'lucide-react';

const getResultIcon = (type: string) => {
  switch (type) {
    case 'customer':
      return <Users className="w-4 h-4" />;
    case 'vehicle':
      return <Car className="w-4 h-4" />;
    case 'contract':
      return <FileText className="w-4 h-4" />;
    case 'invoice':
      return <Receipt className="w-4 h-4" />;
    case 'employee':
      return <UserCheck className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getResultRoute = (type: string, id: string) => {
  switch (type) {
    case 'customer':
      return '/customers';
    case 'vehicle':
      return '/fleet';
    case 'contract':
      return '/contracts';
    case 'invoice':
      return '/invoicing';
    case 'employee':
      return '/employees';
    default:
      return '/';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'customer':
      return 'عميل';
    case 'vehicle':
      return 'مركبة';
    case 'contract':
      return 'عقد';
    case 'invoice':
      return 'فاتورة';
    case 'employee':
      return 'موظف';
    default:
      return type;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'customer':
      return 'bg-blue-500';
    case 'vehicle':
      return 'bg-green-500';
    case 'contract':
      return 'bg-orange-500';
    case 'invoice':
      return 'bg-purple-500';
    case 'employee':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

export const SearchDialog = () => {
  const navigate = useNavigate();
  const {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    performSearch,
    clearSearch
  } = useSearch();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      clearSearch();
    }
  }, [searchQuery, performSearch, clearSearch]);

  const handleSelect = (result: any) => {
    const route = getResultRoute(result.type, result.id);
    navigate(route);
    setIsOpen(false);
    clearSearch();
  };

  const groupedResults = searchResults.reduce((groups, result) => {
    const type = result.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {} as Record<string, typeof searchResults>);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="ابحث في النظام... (Ctrl+K)"
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="mr-2 text-sm text-muted-foreground">جاري البحث...</span>
          </div>
        )}
        
        {!isLoading && searchQuery.length > 2 && searchResults.length === 0 && (
          <CommandEmpty>لا توجد نتائج للبحث "{searchQuery}"</CommandEmpty>
        )}
        
        {!isLoading && searchQuery.length <= 2 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            اكتب 3 أحرف على الأقل للبدء في البحث
          </div>
        )}

        {Object.entries(groupedResults).map(([type, results]) => (
          <CommandGroup key={type} heading={getTypeLabel(type)}>
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                value={`${result.title} ${result.description}`}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getResultIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.description}
                    </div>
                  </div>
                  <Badge 
                    className={`text-white text-xs ${getTypeBadgeColor(result.type)}`}
                  >
                    {getTypeLabel(result.type)}
                  </Badge>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};