import { z } from "zod";

export const onboardingSchema = z.object({
  basics: z.object({
    businessName: z.string().min(1),
    industry: z.string().min(1),
    description: z.string().optional().default(""),
    country: z.string().optional().default(""),
    city: z.string().optional().default(""),
    language: z.string().optional().default("en"),
    websiteUrl: z.string().optional().default(""),
  }),
  maps: z.object({
    placeQuery: z.string().optional().default(""),
    placeId: z.string().optional().default(""),
    address: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    openingHours: z.string().optional().default(""),
    serviceArea: z.string().optional().default(""),
    placeDetails: z.unknown().optional(),
  }),
  goal: z.string().min(1),
  websiteType: z.string().min(1),
  style: z.object({
    preset: z.string().min(1),
    colors: z.string().optional().default(""),
    generateImageSuggestions: z.boolean().optional().default(true),
  }),
  services: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional().default(""),
      price: z.string().optional().default(""),
      duration: z.string().optional().default(""),
      cta: z.string().optional().default(""),
    }),
  ),
  audience: z.object({
    who: z.string().optional().default(""),
    painPoints: z.string().optional().default(""),
    whyChoose: z.string().optional().default(""),
    competitors: z.string().optional().default(""),
    offers: z.string().optional().default(""),
  }),
});

export type OnboardingPayload = z.infer<typeof onboardingSchema>;
