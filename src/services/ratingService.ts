import { supabase } from '@/integrations/supabase/client';

export interface RatingStats {
  averageCustomerRating: number;
  totalEvaluations: number;
  excellentRatings: number;
  goodRatings: number;
  poorRatings: number;
  thisMonthAverage: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalContracts: number;
  averageRating: number;
  totalRevenue: number;
}

export const ratingService = {
  async getRatingStats(): Promise<RatingStats> {
    // Get all customer evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from('customer_evaluations')
      .select('overall_rating, created_at');

    if (evalError) throw evalError;

    const ratings = evaluations || [];
    const totalEvaluations = ratings.length;

    if (totalEvaluations === 0) {
      return {
        averageCustomerRating: 0,
        totalEvaluations: 0,
        excellentRatings: 0,
        goodRatings: 0,
        poorRatings: 0,
        thisMonthAverage: 0,
      };
    }

    const averageRating = ratings.reduce((sum, evaluation) => sum + evaluation.overall_rating, 0) / totalEvaluations;
    const excellentRatings = ratings.filter(evaluation => evaluation.overall_rating >= 4).length;
    const goodRatings = ratings.filter(evaluation => evaluation.overall_rating === 3).length;
    const poorRatings = ratings.filter(evaluation => evaluation.overall_rating <= 2).length;

    // This month's ratings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRatings = ratings.filter(evaluation => 
      new Date(evaluation.created_at) >= startOfMonth
    );

    const thisMonthAverage = thisMonthRatings.length > 0
      ? thisMonthRatings.reduce((sum, evaluation) => sum + evaluation.overall_rating, 0) / thisMonthRatings.length
      : 0;

    return {
      averageCustomerRating: Number(averageRating.toFixed(1)),
      totalEvaluations,
      excellentRatings,
      goodRatings,
      poorRatings,
      thisMonthAverage: Number(thisMonthAverage.toFixed(1)),
    };
  },

  async getTopCustomers(limit: number = 5): Promise<TopCustomer[]> {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id, name, total_contracts, total_revenue,
        customer_evaluations(overall_rating)
      `)
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return customers.map((customer: any) => {
      const evaluations = customer.customer_evaluations || [];
      const averageRating = evaluations.length > 0
        ? evaluations.reduce((sum: number, evaluation: any) => sum + evaluation.overall_rating, 0) / evaluations.length
        : 0;

      return {
        id: customer.id,
        name: customer.name,
        totalContracts: customer.total_contracts || 0,
        averageRating: Number(averageRating.toFixed(1)),
        totalRevenue: customer.total_revenue || 0,
      };
    });
  },
};