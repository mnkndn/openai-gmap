import { OPEN_AI_API_KEY } from "$env/static/private";
import type { RequestEvent } from "../$types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPEN_AI_API_KEY,
});

export async function POST(requestEvent: RequestEvent): Promise<Response> {
  try {
    const { textQuery } = await requestEvent.request.json();

    const completion = openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [
        {
          role: "system",
          content: "You are a middleware between user and google maps API.",
        },
        {
          role: "user",
          content: textQuery,
        },
      ],
      functions: [
        {
          name: "invalidFunction",
          description: `
          Validate user query. The query is invalid if any of the following conditions are met:
          - If user asks for distance around a single location. (Since we support only two different locations)
          - If user wants multiple routes and/or compare them. (Since we support only a single route between two locations)
          - If user asks for a single nearby place from a location (Since we support only multiple nearby places from a location)
          - If user asks for places based on rating/timings/price (Since we support only places based on type from a location)
          - If either origin or destination is not specified, infer that query requests for current location and hence is not valid (Since we do not support current location).
          - If user is asking for information based on his/her current location (Since we do not support current location)
          - If user's query is not related to directions or nearby places
        `,
          parameters: {
            type: "object",
            properties: {
              valid: {
                type: "boolean",
                description: `Always false`,
                enum: [false],
              },
              errorMessage: {
                type: "string",
                description: "Error message as to why the query is invalid",
              },
            },
            required: ["valid", "errorMessage"],
            additionalProperties: false,
          },
        },
        {
          name: "findRoute",
          description: "Find route between two different locations",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin location",
              },
              destination: {
                type: "string",
                description: "Destination location",
              },
              travelMode: {
                type: "string",
                description:
                  "Travel mode to use. Defaults to 'DRIVING' if none specified",
                enum: ["WALKING", "DRIVING", "BICYCLING", "TRANSIT"],
              },
              withDistance: {
                type: "boolean",
                description:
                  "Defaults to false if user's query does not explicitly request for distance data",
              },
              withTraffic: {
                type: "boolean",
                description:
                  "Defaults to false if user's query does not explicitly request for traffic data",
              },
            },
            required: [
              "origin",
              "destination",
              "travelMode",
              "withDistance",
              "withTraffic",
            ],
            additionalProperties: false,
          },
        },
        {
          name: "findNearby",
          description:
            "Find nearby places from a given location and type of place to search",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "Location from which to search nearby places",
              },
              type: {
                type: "string",
                description: "Type of place to search nearby",
                enum: [
                  "accounting",
                  "airport",
                  "amusement_park",
                  "aquarium",
                  "art_gallery",
                  "atm",
                  "bakery",
                  "bank",
                  "bar",
                  "beauty_salon",
                  "bicycle_store",
                  "book_store",
                  "bowling_alley",
                  "bus_station",
                  "cafe",
                  "campground",
                  "car_dealer",
                  "car_rental",
                  "car_repair",
                  "car_wash",
                  "casino",
                  "cemetery",
                  "church",
                  "city_hall",
                  "clothing_store",
                  "convenience_store",
                  "courthouse",
                  "dentist",
                  "department_store",
                  "doctor",
                  "drugstore",
                  "electrician",
                  "electronics_store",
                  "embassy",
                  "fire_station",
                  "florist",
                  "funeral_home",
                  "furniture_store",
                  "gas_station",
                  "gym",
                  "hair_care",
                  "hardware_store",
                  "hindu_temple",
                  "home_goods_store",
                  "hospital",
                  "insurance_agency",
                  "jewelry_store",
                  "laundry",
                  "lawyer",
                  "library",
                  "light_rail_station",
                  "liquor_store",
                  "local_government_office",
                  "locksmith",
                  "lodging",
                  "meal_delivery",
                  "meal_takeaway",
                  "mosque",
                  "movie_rental",
                  "movie_theater",
                  "moving_company",
                  "museum",
                  "night_club",
                  "painter",
                  "park",
                  "parking",
                  "pet_store",
                  "pharmacy",
                  "physiotherapist",
                  "plumber",
                  "police",
                  "post_office",
                  "primary_school",
                  "real_estate_agency",
                  "restaurant",
                  "roofing_contractor",
                  "rv_park",
                  "school",
                  "secondary_school",
                  "shoe_store",
                  "shopping_mall",
                  "spa",
                  "stadium",
                  "storage",
                  "store",
                  "subway_station",
                  "supermarket",
                  "synagogue",
                  "taxi_stand",
                  "tourist_attraction",
                  "train_station",
                  "transit_station",
                  "travel_agency",
                  "university",
                  "veterinary_care",
                  "zoo",
                ],
              },
            },
            required: ["location", "type"],
            additionalProperties: false,
          },
        },
      ],
    });

    const response = await completion;
    if (response.choices[0].message.function_call) {
      return new Response(
        JSON.stringify({
          ...JSON.parse(response.choices[0].message.function_call.arguments),
          functionName: response.choices[0].message.function_call.name,
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } else {
      return new Response("Incorrect LLM response", {
        status: 500,
      });
    }
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
