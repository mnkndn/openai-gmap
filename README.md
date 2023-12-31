# Open AI Integration w/ Google Maps

This project integrates with Open AI LLM and Google Maps API to display routes and nearby locations from user prompts.

## Prerequisites

- [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Open AI API Key](https://platform.openai.com/api-keys)
- Create an `.env` file at the project's root and include the keys (Refer `.env.example` file for env variables)

## Installation

```bash
# install dependencies
npm i

# start the development server
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Usage

Provide a prompt asking for map queries. The application will try it's best to show the results in the map view as well as provide useful information in the content view.

- #### Example: Route query

  &nbsp;
  <kbd>
  <img width="600" alt="Route Query" src="https://github.com/mnkndn/openai-gmap/assets/45232034/98c5ff66-f0cb-48eb-9b20-7f4cef434374">
  </kbd>

- #### Example: Nearby places query

  &nbsp;
  <kbd>
  <img width="600" alt="Nearby Places Query" src="https://github.com/mnkndn/openai-gmap/assets/45232034/1a63a580-74c3-4a5e-8224-fb12d0eb7740">
  </kbd>

- #### Example: Irrelevant query
  &nbsp;
  <kbd>
  <img width="600" alt="Irrelevant Query" src="https://github.com/mnkndn/openai-gmap/assets/45232034/038bded7-1f54-4e1c-aef7-e2cbea5c57eb">
  </kbd>

### Supported queries:

- Route calculations between two locations
- Route with traffic information
- Support for bike/car/public transit/walking routes
- Distance between two locations
- Find nearby places around a given location

### Unsupported queries:

- Queries unrelated to maps
- Distance/Route calculations around a single location
- Multiple routes/waypoints
- Routes to/from current location
- Step by step navigation
- Places along a route
- Search places from current location
- Places based on ratings/timings
