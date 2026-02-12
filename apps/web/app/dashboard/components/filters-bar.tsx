"use client";

import { useState, useEffect } from "react";
import { SearchIcon, FilterIcon, XIcon, CalendarIcon, ChevronDownIcon } from "lucide-react";

export interface Filter {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect" | "date" | "daterange";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: any;
}

export interface FiltersBarProps {
  filters: Filter[];
  onFiltersChange: (filters: Record<string, any>) => void;
  searchPlaceholder?: string;
  className?: string;
  showSearch?: boolean;
  showClearAll?: boolean;
}

export function FiltersBar({
  filters,
  onFiltersChange,
  searchPlaceholder = "Pesquisar...",
  className = "",
  showSearch = true,
  showClearAll = true,
}: FiltersBarProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize values from filters
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.value !== undefined) {
        initialValues[filter.key] = filter.value;
      }
    });
    setValues(initialValues);
  }, [filters]);

  const handleValueChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);

    // Include search in the callback
    const allFilters = showSearch ? { search: searchValue, ...newValues } : newValues;
    onFiltersChange(allFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const allFilters = { search: value, ...values };
    onFiltersChange(allFilters);
  };

  const clearAllFilters = () => {
    setValues({});
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(values).some(key => {
    const value = values[key];
    return value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
  }) || searchValue !== "";

  const activeFilterCount = Object.keys(values).filter(key => {
    const value = values[key];
    return value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
  }).length + (searchValue ? 1 : 0);

  const FilterInput = ({ filter }: { filter: Filter }) => {
    const value = values[filter.key];

    switch (filter.type) {
      case "text":
        return (
          <input
            type="text"
            placeholder={filter.placeholder || filter.label}
            value={value || ""}
            onChange={(e) => handleValueChange(filter.key, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            data-testid={`filter-${filter.key}`}
          />
        );

      case "select":
        return (
          <div className="relative">
            <select
              value={value || ""}
              onChange={(e) => handleValueChange(filter.key, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
              data-testid={`filter-${filter.key}`}
            >
              <option value="">{filter.placeholder || `Selecionar ${filter.label}`}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case "multiselect":
        return (
          <div className="relative">
            <div className="border border-gray-300 rounded-md p-2 min-h-[38px] cursor-pointer">
              {(!value || value.length === 0) ? (
                <span className="text-gray-500 text-sm">
                  {filter.placeholder || `Selecionar ${filter.label}`}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {value.map((val: string) => {
                    const option = filter.options?.find(opt => opt.value === val);
                    return (
                      <span
                        key={val}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                      >
                        {option?.label || val}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValue = value.filter((v: string) => v !== val);
                            handleValueChange(filter.key, newValue);
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Note: Full multiselect dropdown would need additional state management */}
          </div>
        );

      case "date":
        return (
          <div className="relative">
            <input
              type="date"
              value={value || ""}
              onChange={(e) => handleValueChange(filter.key, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              data-testid={`filter-${filter.key}`}
            />
            <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case "daterange":
        const [startDate, endDate] = Array.isArray(value) ? value : ["", ""];
        return (
          <div className="flex space-x-2">
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => handleValueChange(filter.key, [e.target.value, endDate])}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Data inicial"
              data-testid={`filter-${filter.key}-start`}
            />
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => handleValueChange(filter.key, [startDate, e.target.value])}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Data final"
              data-testid={`filter-${filter.key}-end`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`} data-testid="filters-bar">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search and Filter Toggle */}
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="relative flex-1 sm:flex-initial sm:w-80">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                data-testid="search-input"
              />
            </div>
          )}

          {filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-testid="toggle-filters"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Clear All */}
        {showClearAll && hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            data-testid="clear-all-filters"
          >
            <XIcon className="h-4 w-4 mr-1" />
            Limpar Tudo
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <FilterInput filter={filter} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>

            {searchValue && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Pesquisa: "{searchValue}"
                <button
                  onClick={() => handleSearchChange("")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  data-testid="clear-search"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {Object.entries(values).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;

              const filter = filters.find(f => f.key === key);
              if (!filter) return null;

              let displayValue = value;
              if (filter.type === "select") {
                const option = filter.options?.find(opt => opt.value === value);
                displayValue = option?.label || value;
              } else if (filter.type === "multiselect" && Array.isArray(value)) {
                displayValue = value.map((val: string) => {
                  const option = filter.options?.find(opt => opt.value === val);
                  return option?.label || val;
                }).join(", ");
              } else if (filter.type === "daterange" && Array.isArray(value)) {
                const [start, end] = value;
                displayValue = `${start || "..."} - ${end || "..."}`;
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {filter.label}: {displayValue}
                  <button
                    onClick={() => handleValueChange(key, filter.type === "multiselect" ? [] : "")}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                    data-testid={`clear-filter-${key}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Preset filter configurations
export const FilterPresets = {
  status: (options: Array<{ value: string; label: string }>) => ({
    key: "status",
    label: "Status",
    type: "select" as const,
    options,
    placeholder: "Todos os status",
  }),

  dateRange: (key = "dateRange", label = "Período") => ({
    key,
    label,
    type: "daterange" as const,
  }),

  search: (key = "search", placeholder = "Pesquisar...") => ({
    key,
    label: "Pesquisa",
    type: "text" as const,
    placeholder,
  }),

  category: (options: Array<{ value: string; label: string }>, key = "category", label = "Categoria") => ({
    key,
    label,
    type: "multiselect" as const,
    options,
    placeholder: "Selecionar categorias",
  }),
};
