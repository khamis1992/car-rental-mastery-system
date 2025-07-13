import { supabase } from '@/integrations/supabase/client';
import { eventBusService, BusinessEventTypes } from '@/services/EventBus/EventBusService';

// واجهة طلب API
export interface APIRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  clientId: string;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// واجهة استجابة API
export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  processingTime: number;
  cacheHit?: boolean;
  errors?: string[];
}

// إعدادات الحدود
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipOnSuccess?: boolean;
  skipOnFailure?: boolean;
  keyGenerator?: (request: APIRequest) => string;
}

// إعدادات التخزين المؤقت
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
  invalidateOn?: string[];
}

// إعدادات التوجيه
export interface RouteConfig {
  path: string;
  method: string;
  targetService: string;
  targetPath?: string;
  authentication: boolean;
  authorization?: string[];
  rateLimit?: RateLimitConfig;
  cache?: CacheConfig;
  timeout?: number;
  retries?: number;
  circuitBreaker?: boolean;
}

// مقاييس الأداء
export interface PerformanceMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
  uptime: number;
}

// حالة الخدمة
export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

// واجهة Circuit Breaker
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
}

class APIGatewayService {
  private routes: Map<string, RouteConfig> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private tenant_id: string | null = null;

  constructor() {
    this.initializeTenant();
    this.initializeRoutes();
    this.initializeMetrics();
    this.startHealthCheck();
  }

  private async initializeTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        this.tenant_id = data?.tenant_id || null;
      }
    } catch (error) {
      console.error('Error initializing tenant:', error);
    }
  }

  private initializeMetrics() {
    this.performanceMetrics = {
      totalRequests: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      uptime: Date.now()
    };
  }

  private initializeRoutes() {
    // تسجيل المسارات الأساسية
    this.registerRoute({
      path: '/api/accounting/*',
      method: '*',
      targetService: 'accounting-service',
      authentication: true,
      authorization: ['accounting:read', 'accounting:write'],
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000 // 1 minute
      },
      cache: {
        ttl: 300, // 5 minutes
        key: 'accounting-{path}-{query}',
        tags: ['accounting']
      },
      timeout: 30000,
      retries: 3,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/contracts/*',
      method: '*',
      targetService: 'contract-service',
      authentication: true,
      authorization: ['contracts:read', 'contracts:write'],
      rateLimit: {
        maxRequests: 200,
        windowMs: 60000
      },
      timeout: 15000,
      retries: 2,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/fleet/*',
      method: '*',
      targetService: 'fleet-service',
      authentication: true,
      authorization: ['fleet:read', 'fleet:write'],
      rateLimit: {
        maxRequests: 300,
        windowMs: 60000
      },
      timeout: 10000,
      retries: 2,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/customers/*',
      method: '*',
      targetService: 'crm-service',
      authentication: true,
      authorization: ['customers:read', 'customers:write'],
      rateLimit: {
        maxRequests: 500,
        windowMs: 60000
      },
      cache: {
        ttl: 600, // 10 minutes
        key: 'crm-{path}-{query}',
        tags: ['customers']
      },
      timeout: 20000,
      retries: 3,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/hr/*',
      method: '*',
      targetService: 'hr-service',
      authentication: true,
      authorization: ['hr:read', 'hr:write'],
      rateLimit: {
        maxRequests: 150,
        windowMs: 60000
      },
      timeout: 25000,
      retries: 2,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/reports/*',
      method: 'GET',
      targetService: 'reporting-service',
      authentication: true,
      authorization: ['reports:read'],
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000
      },
      cache: {
        ttl: 1800, // 30 minutes
        key: 'reports-{path}-{query}',
        tags: ['reports']
      },
      timeout: 60000, // 1 minute for reports
      retries: 1,
      circuitBreaker: true
    });

    this.registerRoute({
      path: '/api/analytics/*',
      method: 'GET',
      targetService: 'analytics-service',
      authentication: true,
      authorization: ['analytics:read'],
      rateLimit: {
        maxRequests: 30,
        windowMs: 60000
      },
      cache: {
        ttl: 3600, // 1 hour
        key: 'analytics-{path}-{query}',
        tags: ['analytics']
      },
      timeout: 45000,
      retries: 1,
      circuitBreaker: true
    });

    // مسارات عامة بدون مصادقة
    this.registerRoute({
      path: '/api/health',
      method: 'GET',
      targetService: 'gateway-service',
      authentication: false,
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000
      },
      timeout: 5000
    });

    this.registerRoute({
      path: '/api/public/*',
      method: 'GET',
      targetService: 'public-service',
      authentication: false,
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000
      },
      cache: {
        ttl: 7200, // 2 hours
        key: 'public-{path}',
        tags: ['public']
      },
      timeout: 10000
    });
  }

  // تسجيل مسار جديد
  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
    console.log(`Registered route: ${key} -> ${config.targetService}`);
  }

  // معالجة طلب API
  async handleRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    request.timestamp = new Date();
    
    try {
      // تحديث المقاييس
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.activeConnections++;

      // تسجيل الطلب
      await this.logRequest(request);

      // العثور على المسار المطابق
      const route = this.findMatchingRoute(request);
      if (!route) {
        return this.createErrorResponse(404, 'Route not found', startTime);
      }

      // فحص Circuit Breaker
      if (route.circuitBreaker && !this.isCircuitBreakerClosed(route.targetService)) {
        return this.createErrorResponse(503, 'Service unavailable', startTime);
      }

      // التحقق من الحدود
      if (route.rateLimit && !await this.checkRateLimit(request, route.rateLimit)) {
        return this.createErrorResponse(429, 'Rate limit exceeded', startTime);
      }

      // المصادقة
      if (route.authentication && !await this.authenticateRequest(request)) {
        return this.createErrorResponse(401, 'Authentication required', startTime);
      }

      // التخويل
      if (route.authorization && !await this.authorizeRequest(request, route.authorization)) {
        return this.createErrorResponse(403, 'Insufficient permissions', startTime);
      }

      // فحص التخزين المؤقت
      if (route.cache && request.method === 'GET') {
        const cachedResponse = await this.getCachedResponse(request, route.cache);
        if (cachedResponse) {
          cachedResponse.cacheHit = true;
          this.updateCacheHitRate(true);
          return cachedResponse;
        }
      }

      // توجيه الطلب إلى الخدمة المستهدفة
      const response = await this.forwardRequest(request, route);

      // حفظ في التخزين المؤقت
      if (route.cache && request.method === 'GET' && response.status < 400) {
        await this.cacheResponse(request, route.cache, response);
      }

      this.updateCacheHitRate(false);
      return response;

    } catch (error) {
      console.error('Error handling request:', error);
      this.recordCircuitBreakerFailure(request.path);
      return this.createErrorResponse(500, 'Internal server error', startTime);
    } finally {
      this.performanceMetrics.activeConnections--;
      this.updateAverageResponseTime(Date.now() - startTime);
    }
  }

  // العثور على المسار المطابق
  private findMatchingRoute(request: APIRequest): RouteConfig | null {
    // البحث عن تطابق دقيق أولاً
    const exactKey = `${request.method}:${request.path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // البحث عن تطابق بالنمط
    for (const [key, route] of this.routes.entries()) {
      const [method, path] = key.split(':');
      
      if (method !== '*' && method !== request.method) continue;
      
      if (this.matchesPattern(request.path, path)) {
        return route;
      }
    }

    return null;
  }

  // فحص تطابق النمط
  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return path.startsWith(prefix);
    }
    
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }
    
    return path === pattern;
  }

  // فحص حدود المعدل
  private async checkRateLimit(request: APIRequest, config: RateLimitConfig): Promise<boolean> {
    const key = config.keyGenerator ? 
      config.keyGenerator(request) : 
      `${request.clientId}:${request.path}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const current = this.rateLimitStore.get(key);
    
    if (!current || current.resetTime < now) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (current.count >= config.maxRequests) {
      // تسجيل حدث تجاوز الحد
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'api-gateway',
        data: {
          type: 'rate_limit_exceeded',
          clientId: request.clientId,
          path: request.path,
          limit: config.maxRequests,
          window: config.windowMs
        },
        priority: 'medium'
      });

      return false;
    }

    current.count++;
    return true;
  }

  // مصادقة الطلب
  private async authenticateRequest(request: APIRequest): Promise<boolean> {
    try {
      const authHeader = request.headers['authorization'] || request.headers['Authorization'];
      if (!authHeader) {
        return false;
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return false;
      }

      // إضافة معلومات المستخدم للطلب
      request.userId = user.id;
      
      // الحصول على معرف المستأجر
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        request.tenantId = profile.tenant_id;
      }

      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // تخويل الطلب
  private async authorizeRequest(request: APIRequest, requiredPermissions: string[]): Promise<boolean> {
    if (!request.userId) {
      return false;
    }

    try {
      // فحص صلاحيات المستخدم
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', request.userId)
        .eq('tenant_id', request.tenantId);

      const permissions = userPermissions?.map(p => p.permission) || [];
      
      // التحقق من وجود الصلاحيات المطلوبة
      return requiredPermissions.every(permission => permissions.includes(permission));
    } catch (error) {
      console.error('Authorization error:', error);
      return false;
    }
  }

  // الحصول على استجابة مخزنة
  private async getCachedResponse(request: APIRequest, config: CacheConfig): Promise<APIResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request, config.key);
      
      // في التطبيق الفعلي، سيتم استخدام Redis أو نظام تخزين مؤقت متقدم
      const { data: cachedData } = await supabase
        .from('api_cache')
        .select('response_data, expires_at')
        .eq('cache_key', cacheKey)
        .single();

      if (cachedData && new Date(cachedData.expires_at) > new Date()) {
        return {
          ...cachedData.response_data,
          cacheHit: true
        };
      }

      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  // حفظ الاستجابة في التخزين المؤقت
  private async cacheResponse(request: APIRequest, config: CacheConfig, response: APIResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request, config.key);
      const expiresAt = new Date(Date.now() + (config.ttl * 1000));

      await supabase
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          response_data: {
            status: response.status,
            headers: response.headers,
            body: response.body
          },
          expires_at: expiresAt.toISOString(),
          tags: config.tags || [],
          tenant_id: request.tenantId
        });
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  // إنشاء مفتاح التخزين المؤقت
  private generateCacheKey(request: APIRequest, template: string): string {
    return template
      .replace('{path}', request.path)
      .replace('{query}', JSON.stringify(request.query))
      .replace('{method}', request.method)
      .replace('{tenantId}', request.tenantId || '');
  }

  // توجيه الطلب إلى الخدمة المستهدفة
  private async forwardRequest(request: APIRequest, route: RouteConfig): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      // في التطبيق الفعلي، سيتم توجيه الطلب إلى الخدمة المستهدفة
      // هنا سنحاكي الاستجابة حسب نوع الخدمة
      
      let response: APIResponse;
      
      switch (route.targetService) {
        case 'accounting-service':
          response = await this.handleAccountingRequest(request);
          break;
        case 'contract-service':
          response = await this.handleContractRequest(request);
          break;
        case 'fleet-service':
          response = await this.handleFleetRequest(request);
          break;
        case 'crm-service':
          response = await this.handleCRMRequest(request);
          break;
        case 'hr-service':
          response = await this.handleHRRequest(request);
          break;
        case 'reporting-service':
          response = await this.handleReportingRequest(request);
          break;
        case 'analytics-service':
          response = await this.handleAnalyticsRequest(request);
          break;
        case 'gateway-service':
          response = await this.handleGatewayRequest(request);
          break;
        default:
          response = this.createErrorResponse(501, 'Service not implemented', startTime);
      }

      response.processingTime = Date.now() - startTime;
      return response;

    } catch (error) {
      console.error(`Error forwarding request to ${route.targetService}:`, error);
      throw error;
    }
  }

  // معالجة طلبات المحاسبة
  private async handleAccountingRequest(request: APIRequest): Promise<APIResponse> {
    // توجيه إلى خدمات المحاسبة الموجودة
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Accounting service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات العقود
  private async handleContractRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Contract service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات الأسطول
  private async handleFleetRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Fleet service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات CRM
  private async handleCRMRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'CRM service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات الموارد البشرية
  private async handleHRRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'HR service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات التقارير
  private async handleReportingRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Reporting service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات التحليلات
  private async handleAnalyticsRequest(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Analytics service response', path: request.path },
      processingTime: 0
    };
  }

  // معالجة طلبات البوابة
  private async handleGatewayRequest(request: APIRequest): Promise<APIResponse> {
    if (request.path === '/api/health') {
      const health = await this.getSystemHealth();
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: health,
        processingTime: 0
      };
    }

    return this.createErrorResponse(404, 'Gateway endpoint not found', 0);
  }

  // إنشاء استجابة خطأ
  private createErrorResponse(status: number, message: string, startTime: number): APIResponse {
    this.updateErrorRate();
    
    return {
      status,
      headers: { 'Content-Type': 'application/json' },
      body: { error: message, timestamp: new Date().toISOString() },
      processingTime: Date.now() - startTime,
      errors: [message]
    };
  }

  // فحص حالة Circuit Breaker
  private isCircuitBreakerClosed(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      this.circuitBreakers.set(service, {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date()
      });
      return true;
    }

    const now = new Date();
    
    switch (breaker.state) {
      case 'closed':
        return true;
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half-open';
          return true;
        }
        return false;
      case 'half-open':
        return true;
      default:
        return false;
    }
  }

  // تسجيل فشل Circuit Breaker
  private recordCircuitBreakerFailure(servicePath: string): void {
    const service = this.extractServiceFromPath(servicePath);
    const breaker = this.circuitBreakers.get(service);
    
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= 5) { // حد الفشل
      breaker.state = 'open';
      breaker.nextAttemptTime = new Date(Date.now() + 60000); // دقيقة واحدة
    }
  }

  // استخراج اسم الخدمة من المسار
  private extractServiceFromPath(path: string): string {
    const parts = path.split('/');
    return parts[2] || 'unknown'; // /api/service/...
  }

  // تسجيل الطلب
  private async logRequest(request: APIRequest): Promise<void> {
    try {
      await supabase
        .from('api_requests_log')
        .insert({
          request_id: request.id,
          method: request.method,
          path: request.path,
          client_id: request.clientId,
          user_id: request.userId,
          tenant_id: request.tenantId,
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          timestamp: request.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error logging request:', error);
    }
  }

  // تحديث معدل الاستجابة
  private updateAverageResponseTime(responseTime: number): void {
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalRequests = this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.averageResponseTime = 
      ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  // تحديث معدل الأخطاء
  private updateErrorRate(): void {
    // سيتم تحديثه بناءً على البيانات التاريخية
  }

  // تحديث معدل نجاح التخزين المؤقت
  private updateCacheHitRate(hit: boolean): void {
    // سيتم تحديثه بناءً على البيانات التاريخية
  }

  // بدء فحص الحالة
  private startHealthCheck(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // كل 30 ثانية
  }

  // إجراء فحص الحالة
  private async performHealthCheck(): Promise<void> {
    try {
      const services = ['accounting-service', 'contract-service', 'fleet-service', 'crm-service', 'hr-service'];
      
      for (const service of services) {
        const startTime = Date.now();
        try {
          // محاكاة فحص حالة الخدمة
          const isHealthy = Math.random() > 0.1; // 90% نسبة نجاح
          const responseTime = Date.now() - startTime;
          
          await this.updateServiceHealth(service, {
            service,
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime,
            errorRate: isHealthy ? 0 : 0.1,
            lastCheck: new Date()
          });
        } catch (error) {
          await this.updateServiceHealth(service, {
            service,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            errorRate: 1,
            lastCheck: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error performing health check:', error);
    }
  }

  // تحديث حالة الخدمة
  private async updateServiceHealth(service: string, health: ServiceHealth): Promise<void> {
    try {
      await supabase
        .from('service_health')
        .upsert({
          service_name: service,
          status: health.status,
          response_time: health.responseTime,
          error_rate: health.errorRate,
          last_check: health.lastCheck.toISOString(),
          tenant_id: this.tenant_id
        });
    } catch (error) {
      console.error('Error updating service health:', error);
    }
  }

  // الحصول على حالة النظام
  async getSystemHealth(): Promise<any> {
    try {
      const { data: services } = await supabase
        .from('service_health')
        .select('*')
        .eq('tenant_id', this.tenant_id);

      const metrics = await this.getPerformanceMetrics();
      
      return {
        gateway: {
          status: 'healthy',
          uptime: Date.now() - this.performanceMetrics.uptime,
          version: '1.0.0'
        },
        services: services || [],
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        gateway: { status: 'error' },
        services: [],
        metrics: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  // الحصول على مقاييس الأداء
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // تحديث المقاييس الحية
    const now = Date.now();
    const windowStart = now - 60000; // آخر دقيقة

    const recentRequests = await this.getRecentRequestsCount(windowStart, now);
    this.performanceMetrics.requestsPerSecond = recentRequests / 60;

    return { ...this.performanceMetrics };
  }

  // الحصول على عدد الطلبات الحديثة
  private async getRecentRequestsCount(start: number, end: number): Promise<number> {
    try {
      const { count } = await supabase
        .from('api_requests_log')
        .select('*', { count: 'exact' })
        .eq('tenant_id', this.tenant_id)
        .gte('timestamp', new Date(start).toISOString())
        .lte('timestamp', new Date(end).toISOString());

      return count || 0;
    } catch (error) {
      console.error('Error getting recent requests count:', error);
      return 0;
    }
  }

  // إبطال التخزين المؤقت
  async invalidateCache(tags: string[]): Promise<number> {
    try {
      const { data: deletedItems } = await supabase
        .from('api_cache')
        .delete()
        .eq('tenant_id', this.tenant_id)
        .overlaps('tags', tags);

      // نشر حدث إبطال التخزين المؤقت
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'api-gateway',
        data: {
          type: 'cache_invalidated',
          tags,
          itemsDeleted: deletedItems?.length || 0
        }
      });

      return deletedItems?.length || 0;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return 0;
    }
  }

  // إعادة تعيين حدود المعدل
  resetRateLimits(): void {
    this.rateLimitStore.clear();
    console.log('Rate limits reset');
  }

  // إعادة تعيين Circuit Breakers
  resetCircuitBreakers(): void {
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
    }
    console.log('Circuit breakers reset');
  }
}

// إنشاء مثيل مشترك
export const apiGatewayService = new APIGatewayService();

// تصدير الأنواع
export type {
  APIRequest,
  APIResponse,
  RateLimitConfig,
  CacheConfig,
  RouteConfig,
  PerformanceMetrics,
  ServiceHealth
}; 