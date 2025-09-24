// Credit costs for external API calls
export const CREDIT_COSTS = {
  // Similar channel discovery
  SIMILAR_CHANNELS_DISCOVER: 20,

  // Thumbnail generation
  THUMBNAIL_GENERATE: 15,

  // CTR prediction
  CTR_PREDICT: 5,

  // Audio generation
  AUDIO_GENERATE: 10,

  // Content gap analysis
  GAPS_ANALYSIS: 25,
  GAPS_OVERALL: 30,

  // Video ideas
  IDEAS_GENERATE_NEXT: 15,
  IDEAS_GENERATE_PLAN: 8,
  IDEAS_GENERATE_SEO: 8,
} as const;

// Credit cost descriptions for UI
export const CREDIT_COST_DESCRIPTIONS = {
  SIMILAR_CHANNELS_DISCOVER: "Discover similar channels using AI analysis",
  THUMBNAIL_GENERATE: "Generate AI-powered thumbnails for videos",
  CTR_PREDICT: "Predict click-through rates for thumbnails",
  AUDIO_GENERATE: "Generate voice-overs from text using AI",
  GAPS_ANALYSIS: "Analyze content gaps compared to competitors",
  GAPS_OVERALL: "Comprehensive content gap analysis for your channel",
  IDEAS_GENERATE_NEXT: "Generate next video ideas using AI",
  IDEAS_GENERATE_PLAN: "Create detailed video plans and scripts",
  IDEAS_GENERATE_SEO: "Generate SEO keywords and optimization suggestions",
} as const;

export type CreditCostKey = keyof typeof CREDIT_COSTS;
