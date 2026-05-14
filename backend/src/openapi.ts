export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Adidas Clone API",
    version: "0.1.0"
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "/v1/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: { status: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/categories": {
      get: {
        summary: "List categories",
        responses: {
          "200": {
            description: "OK"
          },
          "502": {
            description: "Supabase error"
          }
        }
      }
    },
    "/v1/products": {
      get: {
        summary: "List products",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, maximum: 100 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0, minimum: 0 }
          },
          {
            name: "q",
            in: "query",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": { description: "OK" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/products/{slug}": {
      get: {
        summary: "Get product detail by slug",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/auth/me": {
      get: {
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/cart": {
      get: {
        summary: "Get cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      },
      delete: {
        summary: "Clear cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/cart/items": {
      post: {
        summary: "Add to cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["product_id", "variant_id", "quantity"],
                properties: {
                  product_id: { type: "string" },
                  variant_id: { type: "string" },
                  quantity: { type: "integer", minimum: 1, maximum: 10 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/cart/items/{item_id}": {
      put: {
        summary: "Update cart item",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "item_id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: { quantity: { type: "integer", minimum: 1, maximum: 10 } }
              }
            }
          }
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "502": { description: "Supabase error" }
        }
      },
      delete: {
        summary: "Remove cart item",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "item_id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/orders": {
      post: {
        summary: "Create order (checkout)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shipping_address"],
                properties: {
                  shipping_address: { type: "object" },
                  payment_method: { type: "string", default: "cod" },
                  shipping_method: { type: "string", default: "standard" },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      },
      get: {
        summary: "List orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 50 } },
          { name: "status", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/orders/{order_id}": {
      get: {
        summary: "Get order detail",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "order_id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "502": { description: "Supabase error" }
        }
      }
    },
    "/v1/orders/{order_id}/cancel": {
      put: {
        summary: "Cancel order",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "order_id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Cannot cancel" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "502": { description: "Supabase error" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
} as const;
