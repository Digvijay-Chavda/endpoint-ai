import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.endpoint.deleteMany();
  await prisma.project.deleteMany();

  // ─── Project 1: E-Commerce API ───────────────────────────────────────────────
  const ecommerce = await prisma.project.create({
    data: {
      name: "E-Commerce API",
      description:
        "Mock backend for an online store — products, cart, and orders.",
      endpoints: {
        create: [
          {
            path: "/products",
            method: "GET",
            latencyMs: 120,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                data: [
                  {
                    id: "prod_001",
                    name: "Wireless Noise-Cancelling Headphones",
                    price: 299.99,
                    currency: "USD",
                    category: "Electronics",
                    inStock: true,
                    rating: 4.7,
                    reviews: 1842,
                    imageUrl: "https://picsum.photos/seed/headphones/400/300",
                  },
                  {
                    id: "prod_002",
                    name: "Ergonomic Mechanical Keyboard",
                    price: 149.99,
                    currency: "USD",
                    category: "Peripherals",
                    inStock: true,
                    rating: 4.5,
                    reviews: 963,
                    imageUrl: "https://picsum.photos/seed/keyboard/400/300",
                  },
                  {
                    id: "prod_003",
                    name: "4K Ultra-Wide Monitor",
                    price: 749.0,
                    currency: "USD",
                    category: "Displays",
                    inStock: false,
                    rating: 4.9,
                    reviews: 512,
                    imageUrl: "https://picsum.photos/seed/monitor/400/300",
                  },
                ],
                total: 3,
                page: 1,
                pageSize: 10,
              },
              null,
              2
            ),
          },
          {
            path: "/products/:id",
            method: "GET",
            latencyMs: 80,
            errorRate: 0.05,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                id: "prod_001",
                name: "Wireless Noise-Cancelling Headphones",
                description:
                  "Industry-leading noise cancellation with 30-hour battery life and premium sound quality.",
                price: 299.99,
                currency: "USD",
                category: "Electronics",
                tags: ["wireless", "audio", "noise-cancelling"],
                inStock: true,
                stockCount: 47,
                rating: 4.7,
                reviews: 1842,
                variants: [
                  { color: "Midnight Black", sku: "HDR-001-BLK" },
                  { color: "Platinum Silver", sku: "HDR-001-SLV" },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/cart",
            method: "POST",
            latencyMs: 200,
            errorRate: 0.1,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_user_token_abc123",
            responseBody: JSON.stringify(
              {
                cartId: "cart_xK9mP2",
                userId: "usr_0042",
                items: [
                  {
                    productId: "prod_001",
                    quantity: 1,
                    unitPrice: 299.99,
                  },
                ],
                subtotal: 299.99,
                tax: 24.0,
                total: 323.99,
                currency: "USD",
                updatedAt: "2024-11-15T10:30:00Z",
              },
              null,
              2
            ),
          },
          {
            path: "/orders",
            method: "POST",
            latencyMs: 450,
            errorRate: 0.15,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_user_token_abc123",
            responseBody: JSON.stringify(
              {
                orderId: "ord_88fZ2kL",
                status: "confirmed",
                estimatedDelivery: "2024-11-19",
                items: [
                  {
                    productId: "prod_001",
                    name: "Wireless Noise-Cancelling Headphones",
                    quantity: 1,
                    price: 299.99,
                  },
                ],
                total: 323.99,
                paymentMethod: "credit_card",
                shippingAddress: {
                  line1: "123 Developer Lane",
                  city: "San Francisco",
                  state: "CA",
                  zip: "94107",
                  country: "US",
                },
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 2: Auth Service ─────────────────────────────────────────────────
  const authService = await prisma.project.create({
    data: {
      name: "Auth Service",
      description:
        "Mock authentication and authorization service with JWT flows.",
      endpoints: {
        create: [
          {
            path: "/auth/register",
            method: "POST",
            latencyMs: 300,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                success: true,
                user: {
                  id: "usr_0099",
                  email: "jane.doe@example.com",
                  username: "janedoe",
                  createdAt: "2024-11-15T09:00:00Z",
                },
                message: "Account created successfully. Please verify your email.",
              },
              null,
              2
            ),
          },
          {
            path: "/auth/login",
            method: "POST",
            latencyMs: 180,
            errorRate: 0.05,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                success: true,
                accessToken:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDA0MiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.mock_signature",
                refreshToken: "rt_9fX3mK7pQ2sL1vN8wD5cR4yU6iO0bA",
                expiresIn: 3600,
                tokenType: "Bearer",
                user: {
                  id: "usr_0042",
                  email: "user@example.com",
                  username: "devuser",
                  role: "admin",
                },
              },
              null,
              2
            ),
          },
          {
            path: "/auth/me",
            method: "GET",
            latencyMs: 60,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_user_token_abc123",
            responseBody: JSON.stringify(
              {
                id: "usr_0042",
                email: "user@example.com",
                username: "devuser",
                role: "admin",
                plan: "pro",
                createdAt: "2024-01-10T08:00:00Z",
                lastLoginAt: "2024-11-15T09:30:00Z",
              },
              null,
              2
            ),
          },
          {
            path: "/auth/logout",
            method: "POST",
            latencyMs: 100,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_user_token_abc123",
            responseBody: JSON.stringify(
              {
                success: true,
                message: "Logged out successfully.",
              },
              null,
              2
            ),
          },
          {
            path: "/auth/refresh",
            method: "POST",
            latencyMs: 150,
            errorRate: 0.02,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                accessToken:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDA0MiIsImlhdCI6MTcwMDAwMzYwMCwiZXhwIjoxNzAwMDkwMDAwfQ.refreshed_mock_signature",
                expiresIn: 3600,
                tokenType: "Bearer",
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 3: Blog & CMS API ───────────────────────────────────────────────
  const blogApi = await prisma.project.create({
    data: {
      name: "Blog & CMS API",
      description:
        "Mock content management endpoints for posts, authors, and tags.",
      endpoints: {
        create: [
          {
            path: "/posts",
            method: "GET",
            latencyMs: 90,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                posts: [
                  {
                    id: "post_001",
                    title: "Getting Started with API Mocking",
                    slug: "getting-started-api-mocking",
                    excerpt:
                      "Learn how mock APIs can dramatically speed up your frontend development workflow.",
                    author: { id: "auth_01", name: "Alice Chen", avatar: "https://i.pravatar.cc/150?u=alice" },
                    tags: ["api", "frontend", "developer-tools"],
                    publishedAt: "2024-11-10T12:00:00Z",
                    readTimeMinutes: 5,
                  },
                  {
                    id: "post_002",
                    title: "Simulating Network Latency for Realistic UX Testing",
                    slug: "simulating-network-latency",
                    excerpt:
                      "Real users don't have instant connections. Here's how to test your UI under pressure.",
                    author: { id: "auth_02", name: "Bob Martinez", avatar: "https://i.pravatar.cc/150?u=bob" },
                    tags: ["ux", "testing", "performance"],
                    publishedAt: "2024-11-12T14:00:00Z",
                    readTimeMinutes: 8,
                  },
                ],
                total: 2,
                page: 1,
              },
              null,
              2
            ),
          },
          {
            path: "/posts/:slug",
            method: "GET",
            latencyMs: 100,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                id: "post_001",
                title: "Getting Started with API Mocking",
                slug: "getting-started-api-mocking",
                content:
                  "# Getting Started with API Mocking\n\nAPI mocking is a technique that allows frontend developers to simulate backend responses without needing a real server...",
                author: {
                  id: "auth_01",
                  name: "Alice Chen",
                  bio: "Senior Frontend Engineer & DX advocate.",
                  avatar: "https://i.pravatar.cc/150?u=alice",
                },
                tags: ["api", "frontend", "developer-tools"],
                publishedAt: "2024-11-10T12:00:00Z",
                updatedAt: "2024-11-11T09:00:00Z",
                readTimeMinutes: 5,
                views: 2341,
              },
              null,
              2
            ),
          },
          {
            path: "/posts",
            method: "POST",
            latencyMs: 250,
            errorRate: 0.08,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_cms_admin_token",
            responseBody: JSON.stringify(
              {
                id: "post_003",
                title: "Your New Post Title",
                slug: "your-new-post-title",
                status: "draft",
                createdAt: "2024-11-15T10:00:00Z",
              },
              null,
              2
            ),
          },
          {
            path: "/posts/:id",
            method: "DELETE",
            latencyMs: 150,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_cms_admin_token",
            responseBody: JSON.stringify(
              {
                success: true,
                message: "Post deleted successfully.",
                deletedId: "post_001",
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 4: Weather & Geo API ───────────────────────────────────────────
  const weatherApi = await prisma.project.create({
    data: {
      name: "Weather & Geo API",
      description:
        "Mock weather data and geocoding service for location-based apps.",
      endpoints: {
        create: [
          {
            path: "/weather/current",
            method: "GET",
            latencyMs: 200,
            errorRate: 0.12,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                location: {
                  city: "San Francisco",
                  region: "California",
                  country: "US",
                  lat: 37.7749,
                  lon: -122.4194,
                  timezone: "America/Los_Angeles",
                },
                current: {
                  tempC: 16.4,
                  tempF: 61.5,
                  feelsLikeC: 14.1,
                  humidity: 78,
                  windKph: 22,
                  windDir: "WSW",
                  conditionText: "Partly Cloudy",
                  conditionIcon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
                  uvIndex: 4,
                  visibilityKm: 16,
                },
                updatedAt: "2024-11-15T10:00:00Z",
              },
              null,
              2
            ),
          },
          {
            path: "/weather/forecast",
            method: "GET",
            latencyMs: 350,
            errorRate: 0.08,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                location: { city: "San Francisco", country: "US" },
                forecast: [
                  { date: "2024-11-15", maxC: 18, minC: 12, conditionText: "Partly Cloudy", precipitationMm: 0 },
                  { date: "2024-11-16", maxC: 20, minC: 13, conditionText: "Sunny", precipitationMm: 0 },
                  { date: "2024-11-17", maxC: 15, minC: 10, conditionText: "Moderate Rain", precipitationMm: 8.4 },
                  { date: "2024-11-18", maxC: 14, minC: 9, conditionText: "Heavy Rain", precipitationMm: 22.1 },
                  { date: "2024-11-19", maxC: 17, minC: 11, conditionText: "Cloudy", precipitationMm: 1.2 },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/geo/search",
            method: "GET",
            latencyMs: 150,
            errorRate: 0.05,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                query: "San Francisco",
                results: [
                  {
                    id: "geo_001",
                    name: "San Francisco",
                    region: "California",
                    country: "United States",
                    lat: 37.7749,
                    lon: -122.4194,
                  },
                  {
                    id: "geo_002",
                    name: "San Francisco de Macorís",
                    region: "Duarte Province",
                    country: "Dominican Republic",
                    lat: 19.3009,
                    lon: -70.2518,
                  },
                ],
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

    // ─── Project 5: Disaster Relief API ──────────────────────────────────────────
  const disasterRelief = await prisma.project.create({
    data: {
      name: "Disaster Relief API",
      description:
        "Mock backend for disaster relief coordination — incidents, resources, volunteers, and shelters.",
      endpoints: {
        create: [
          {
            path: "/incidents",
            method: "GET",
            latencyMs: 120,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                data: [
                  {
                    id: "inc_001",
                    type: "Flood",
                    severity: "critical",
                    location: { city: "Sylhet", country: "Bangladesh", lat: 24.8949, lon: 91.8687 },
                    affectedCount: 12500,
                    status: "active",
                    reportedAt: "2025-03-28T06:00:00Z",
                  },
                  {
                    id: "inc_002",
                    type: "Wildfire",
                    severity: "high",
                    location: { city: "Kelowna", country: "Canada", lat: 49.888, lon: -119.496 },
                    affectedCount: 3200,
                    status: "contained",
                    reportedAt: "2025-03-27T14:30:00Z",
                  },
                  {
                    id: "inc_003",
                    type: "Earthquake",
                    severity: "moderate",
                    location: { city: "Kathmandu", country: "Nepal", lat: 27.7172, lon: 85.3240 },
                    affectedCount: 6800,
                    status: "active",
                    reportedAt: "2025-03-29T09:15:00Z",
                  },
                ],
                total: 3,
                activeCount: 2,
              },
              null,
              2
            ),
          },
          {
            path: "/incidents/:id/resources",
            method: "GET",
            latencyMs: 90,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                incidentId: "inc_001",
                resources: [
                  { type: "Water Purification Tablets", quantity: 50000, unit: "tablets", status: "deployed" },
                  { type: "Emergency Food Packs", quantity: 8000, unit: "packs", status: "in-transit" },
                  { type: "Medical Kits", quantity: 500, unit: "kits", status: "deployed" },
                  { type: "Rescue Boats", quantity: 24, unit: "boats", status: "deployed" },
                  { type: "Temporary Shelters", quantity: 300, unit: "units", status: "pending" },
                ],
                volunteerTeams: [
                  { id: "team_01", name: "Alpha Medical Team", skills: ["first-aid", "triage"], members: 12, available: true },
                  { id: "team_02", name: "Water Rescue Unit", skills: ["diving", "boat-operation"], members: 8, available: false },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/shelters",
            method: "GET",
            latencyMs: 80,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                shelters: [
                  {
                    id: "shlt_001",
                    name: "Sylhet Government High School",
                    address: "Sylhet, Bangladesh",
                    capacity: 800,
                    currentOccupancy: 673,
                    amenities: ["food", "water", "medical", "electricity"],
                    contactPhone: "+880-821-123456",
                  },
                  {
                    id: "shlt_002",
                    name: "Community Sports Complex",
                    address: "Sunamganj, Bangladesh",
                    capacity: 1200,
                    currentOccupancy: 945,
                    amenities: ["food", "water", "medical"],
                    contactPhone: "+880-821-654321",
                  },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/volunteers",
            method: "POST",
            latencyMs: 200,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                success: true,
                volunteerId: "vol_9842",
                message: "Registration confirmed. You'll receive deployment instructions within 2 hours.",
                nextSteps: [
                  "Check your email for onboarding pack",
                  "Report to nearest coordination centre",
                  "Bring valid ID and any listed equipment",
                ],
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 6: Climate Monitor API ──────────────────────────────────────────
  const climateApi = await prisma.project.create({
    data: {
      name: "Climate Monitor API",
      description:
        "Real-time climate sensor data, emissions tracking, and environmental alerts for sustainability apps.",
      endpoints: {
        create: [
          {
            path: "/sensors/stations",
            method: "GET",
            latencyMs: 100,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                stations: [
                  {
                    stationId: "stn_001",
                    name: "Central Park Monitoring Station",
                    location: { city: "New York", country: "US", lat: 40.7851, lon: -73.9683 },
                    readings: {
                      co2Ppm: 418.6,
                      tempC: 12.3,
                      humidity: 65,
                      pm25: 11.2,
                      aqi: 42,
                    },
                    alertLevel: "good",
                    lastUpdated: "2025-03-30T10:00:00Z",
                  },
                  {
                    stationId: "stn_002",
                    name: "Delhi Air Quality Hub",
                    location: { city: "New Delhi", country: "IN", lat: 28.6139, lon: 77.209 },
                    readings: {
                      co2Ppm: 445.2,
                      tempC: 28.7,
                      humidity: 72,
                      pm25: 98.4,
                      aqi: 168,
                    },
                    alertLevel: "unhealthy",
                    lastUpdated: "2025-03-30T10:00:00Z",
                  },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/emissions/trends",
            method: "GET",
            latencyMs: 150,
            errorRate: 0.05,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                region: "Global",
                period: "2024",
                unit: "GtCO2e",
                data: [
                  { month: "2024-01", co2: 3.82, methane: 0.64, n2o: 0.21 },
                  { month: "2024-02", co2: 3.71, methane: 0.62, n2o: 0.20 },
                  { month: "2024-03", co2: 3.88, methane: 0.65, n2o: 0.22 },
                  { month: "2024-04", co2: 3.79, methane: 0.63, n2o: 0.21 },
                ],
                yearOnYearChange: -0.8,
                targetFor2030: 2.1,
              },
              null,
              2
            ),
          },
          {
            path: "/alerts",
            method: "GET",
            latencyMs: 60,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                alerts: [
                  {
                    id: "alrt_001",
                    type: "AirQuality",
                    severity: "high",
                    region: "New Delhi, India",
                    message: "PM2.5 levels at 98.4 μg/m³ — 4× safe limit. Avoid outdoor activity.",
                    issuedAt: "2025-03-30T08:00:00Z",
                    expiresAt: "2025-03-31T08:00:00Z",
                    recommendations: ["Wear N95 mask outdoors", "Keep windows closed", "Use air purifier indoors"],
                  },
                  {
                    id: "alrt_002",
                    type: "HeatWave",
                    severity: "moderate",
                    region: "Rajasthan, India",
                    message: "Temperatures expected to reach 42°C. Hydrate frequently.",
                    issuedAt: "2025-03-30T06:00:00Z",
                    expiresAt: "2025-04-01T18:00:00Z",
                    recommendations: ["Stay indoors 12–4PM", "Drink 3L+ water daily"],
                  },
                ],
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 7: Open Health API ───────────────────────────────────────────────
  const healthApi = await prisma.project.create({
    data: {
      name: "Open Health API",
      description:
        "Mock healthcare data endpoints — patients, appointments, medications, and risk assessments.",
      endpoints: {
        create: [
          {
            path: "/patients",
            method: "GET",
            latencyMs: 130,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_health_token_xyz",
            responseBody: JSON.stringify(
              {
                patients: [
                  {
                    id: "pat_001",
                    name: "Arjun Sharma",
                    age: 54,
                    gender: "male",
                    bloodType: "O+",
                    condition: "Type 2 Diabetes",
                    riskLevel: "high",
                    medications: [
                      { name: "Metformin", dosage: "500mg", frequency: "twice daily" },
                      { name: "Linagliptin", dosage: "5mg", frequency: "once daily" },
                    ],
                    nextAppointment: { date: "2025-04-05", doctor: "Dr. Priya Nair", type: "Follow-up" },
                  },
                  {
                    id: "pat_002",
                    name: "Grace O'Sullivan",
                    age: 38,
                    gender: "female",
                    bloodType: "A-",
                    condition: "Hypertension",
                    riskLevel: "moderate",
                    medications: [
                      { name: "Amlodipine", dosage: "5mg", frequency: "once daily" },
                    ],
                    nextAppointment: { date: "2025-04-12", doctor: "Dr. Chen Wei", type: "Routine Check" },
                  },
                ],
                total: 2,
                page: 1,
              },
              null,
              2
            ),
          },
          {
            path: "/appointments",
            method: "GET",
            latencyMs: 80,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: true,
            customAuthHeader: "Bearer mock_health_token_xyz",
            responseBody: JSON.stringify(
              {
                appointments: [
                  { id: "apt_001", patientId: "pat_001", doctor: "Dr. Priya Nair", specialty: "Endocrinology", date: "2025-04-05", time: "10:30", type: "Follow-up", status: "confirmed" },
                  { id: "apt_002", patientId: "pat_002", doctor: "Dr. Chen Wei", specialty: "Cardiology", date: "2025-04-12", time: "14:00", type: "Routine Check", status: "confirmed" },
                  { id: "apt_003", patientId: "pat_001", doctor: "Dr. Sam Patel", specialty: "Dietician", date: "2025-04-20", time: "11:00", type: "Nutrition Plan", status: "pending" },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/medications/:id",
            method: "GET",
            latencyMs: 60,
            errorRate: 0.02,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                id: "med_001",
                name: "Metformin",
                genericName: "Metformin Hydrochloride",
                class: "Biguanide",
                usedFor: ["Type 2 Diabetes", "PCOS"],
                dosageForms: ["500mg tablet", "850mg tablet", "1000mg tablet"],
                sideEffects: ["Nausea", "Diarrhea", "Stomach upset"],
                interactions: ["Alcohol", "Iodine contrast dye", "Topiramate"],
                stockDays: 28,
                requiresPrescription: true,
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  // ─── Project 8: Food Bank Network API ────────────────────────────────────────
  const foodBankApi = await prisma.project.create({
    data: {
      name: "Food Bank Network API",
      description:
        "Mock endpoints for a food bank coordination platform — locations, inventory, and donation tracking.",
      endpoints: {
        create: [
          {
            path: "/locations",
            method: "GET",
            latencyMs: 100,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                locations: [
                  {
                    id: "loc_001",
                    name: "East Side Community Food Hub",
                    address: "142 Maple St, Toronto, ON",
                    coordinates: { lat: 43.6532, lon: -79.3832 },
                    operatingHours: "Mon–Fri 9am–5pm, Sat 10am–2pm",
                    phone: "+1-416-555-0101",
                    weeklyCapacity: 500,
                    currentCapacity: 412,
                  },
                  {
                    id: "loc_002",
                    name: "Westview Food Pantry",
                    address: "78 Oak Avenue, Vancouver, BC",
                    coordinates: { lat: 49.2827, lon: -123.1207 },
                    operatingHours: "Tue & Thu 10am–4pm",
                    phone: "+1-604-555-0198",
                    weeklyCapacity: 300,
                    currentCapacity: 287,
                  },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/locations/:id/inventory",
            method: "GET",
            latencyMs: 90,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                locationId: "loc_001",
                lastUpdated: "2025-03-30T08:00:00Z",
                inventory: [
                  {
                    category: "Grains & Cereals",
                    items: [
                      { name: "Brown Rice", quantity: 420, unit: "kg", expiryDate: "2026-06-01", status: "available" },
                      { name: "Rolled Oats", quantity: 180, unit: "kg", expiryDate: "2025-12-01", status: "available" },
                    ],
                  },
                  {
                    category: "Canned Goods",
                    items: [
                      { name: "Canned Tomatoes", quantity: 1200, unit: "cans", expiryDate: "2026-03-01", status: "available" },
                      { name: "Chickpeas (400g)", quantity: 850, unit: "cans", expiryDate: "2026-01-01", status: "low" },
                    ],
                  },
                  {
                    category: "Fresh Produce",
                    items: [
                      { name: "Cabbage", quantity: 75, unit: "heads", expiryDate: "2025-04-05", status: "critical" },
                      { name: "Carrots", quantity: 60, unit: "kg", expiryDate: "2025-04-08", status: "available" },
                    ],
                  },
                ],
              },
              null,
              2
            ),
          },
          {
            path: "/donations",
            method: "POST",
            latencyMs: 180,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                success: true,
                donationId: "don_7823",
                message: "Thank you! Your donation will feed 12 families this week.",
                impact: {
                  mealsProvided: 48,
                  familiesHelped: 12,
                  co2SavedKg: 3.4,
                },
                receiptUrl: "https://example.com/receipts/don_7823.pdf",
              },
              null,
              2
            ),
          },
          {
            path: "/donations/stats",
            method: "GET",
            latencyMs: 70,
            errorRate: 0.0,
            active: true,
            enableCors: true,
            requireAuth: false,
            responseBody: JSON.stringify(
              {
                stats: {
                  thisMonth: {
                    totalDonations: 8420,
                    totalDonorsCount: 312,
                    totalFoodKg: 3850,
                    mealsProvided: 9200,
                    familiesHelped: 1840,
                  },
                  allTime: {
                    totalDonations: 142600,
                    totalFoodKg: 68000,
                    mealsProvided: 185000,
                    familiesHelped: 37000,
                  },
                },
                topCategories: ["Grains", "Canned Goods", "Fresh Produce", "Dairy"],
              },
              null,
              2
            ),
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded 4 social-good projects:`);
  console.log(`   🆘 ${disasterRelief.name} — 4 endpoints`);
  console.log(`   🌿 ${climateApi.name} — 3 endpoints`);
  console.log(`   🏥 ${healthApi.name} — 3 endpoints`);
  console.log(`   🍞 ${foodBankApi.name} — 4 endpoints`);
  console.log("🎉 Seed complete!");
  
  console.log(`✅ Seeded 4 projects:`);
  console.log(`   📦 ${ecommerce.name} — 4 endpoints`);
  console.log(`   🔐 ${authService.name} — 5 endpoints`);
  console.log(`   📝 ${blogApi.name} — 4 endpoints`);
  console.log(`   🌤️  ${weatherApi.name} — 3 endpoints`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
