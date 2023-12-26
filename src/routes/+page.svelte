<script lang="ts">
  import SupportModal from "$lib/SupportModal.svelte";
  import ArrowRight from "$lib/icons/ArrowRight.svelte";
  import SupportIcon from "$lib/icons/SupportIcon.svelte";
  import { onMount, beforeUpdate, afterUpdate } from "svelte";

  // Google Maps API Key
  import { PUBLIC_MAP_API_KEY } from "$env/static/public";

  // User input state
  let input = "";
  let disabled = false;

  // Google maps container
  let mapDiv: HTMLElement | null = null;

  // Content stream container - Used for auto-scrolling
  let contentDiv: HTMLElement | null = null;
  let autoscroll = false;

  // HTML stream from LLM
  let htmlStream = "";

  // Iframe - For embedding map with traffic info
  let showTrafficView = false;
  let iframeOrigin = "";
  let iframeDestination = "";

  // Support modal visibility state
  let modalVisibility = false;

  // Map SDK's instances
  let mapInstance: google.maps.Map | null = null;
  let directionsRenderer: google.maps.DirectionsRenderer | null = null;
  let markers: google.maps.Marker[] = [];

  onMount(() => {
    // Initialize map instance on mount
    if (mapDiv) {
      mapInstance = new google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
    }
  });

  beforeUpdate(() => {
    // If user scrolls up, autoscroll is disabled
    autoscroll = Boolean(
      contentDiv &&
        contentDiv.offsetHeight + contentDiv.scrollTop >
          contentDiv.scrollHeight - 20
    );
  });

  afterUpdate(() => {
    // Autoscroll to bottom when new contents are streamed in
    // if user is at the bottom of the container
    if (autoscroll) contentDiv?.scrollTo(0, contentDiv.scrollHeight);
  });

  // Function to show route between two locations
  const showDirection = async (
    origin: string,
    destination: string,
    mode: string,
    withDistance: boolean,
    withTraffic: boolean
  ) => {
    // If traffic view is requested, switch to iframe view
    if (withTraffic) {
      showTrafficView = true;
      iframeOrigin = origin;
      iframeDestination = destination;
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService
      .route({
        origin: {
          query: origin,
        },
        destination: {
          query: destination,
        },
        travelMode: mode as google.maps.TravelMode,
      })
      .then((response) => {
        // Get distance and duration info from map api's response
        const distance = response.routes[0].legs[0].distance?.text;
        const duration = response.routes[0].legs[0].duration?.text;

        // Render the route on the map
        directionsRenderer?.setMap(mapInstance);
        directionsRenderer?.setDirections(response);

        // Send the response to LLM for text generation
        generateHTMLStream({
          distance: withDistance ? distance : undefined,
          duration,
        });
      })
      .catch((err) => console.log("Error in fetching directions", err));
  };

  // Function to show nearby places around a location
  const showNearby = async (place: string, type: string = "restaurant") => {
    if (mapInstance) {
      // Find the location info from the given place name
      const placesRequest = {
        query: place,
        fields: ["name", "geometry"],
      };

      const placesService = new google.maps.places.PlacesService(mapInstance);

      placesService.findPlaceFromQuery(placesRequest, (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results?.length
        ) {
          // Get LatLng info and location name
          const location = results[0].geometry?.location;
          const locationName = results[0].name;

          // Center the map on the location and zoom in
          mapInstance?.setCenter(
            results[0].geometry?.location as google.maps.LatLng
          );
          mapInstance?.setZoom(16);

          // Search for nearby places from the given location and type
          const request: google.maps.places.PlaceSearchRequest = {
            location,
            radius: 500,
            type,
          };

          placesService.nearbySearch(request, (results, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results?.length
            ) {
              // Initialize info window for showing place names on click
              const infoWindow = new google.maps.InfoWindow();

              for (const place of results) {
                // Create a marker for each place
                const marker = new google.maps.Marker({
                  position: place.geometry?.location,
                  map: mapInstance,
                  title: place.name,
                });

                // Open info window on click
                marker.addListener("click", () => {
                  infoWindow.close();
                  infoWindow.setContent(place.name);
                  infoWindow.open(mapInstance, marker);
                });

                markers.push(marker);
              }

              // Send the response to LLM for text generation
              generateHTMLStream({
                places: results.map((place) => place.name),
              });
            }
          });
        }
      });
    }
  };

  // Function to send user's input to LLM
  // and find the appropriate downstream function to call
  const generateLocationRequest = async () => {
    htmlStream = "Generating response...";
    try {
      const response = await fetch("/api/textToLocationRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textQuery: input }),
      });

      const data = await response.json();
      const { functionName } = data;

      // Clear existing markers and directions
      clearMap();

      // Call the appropriate function based on LLM's response
      if (functionName === "findNearby") {
        showNearby(data.location, data.type);
      } else if (functionName === "findRoute") {
        const {
          origin,
          destination,
          travelMode = google.maps.TravelMode.DRIVING,
          withDistance = false,
          withTraffic = false,
        } = data;
        showDirection(
          origin,
          destination,
          travelMode,
          withDistance,
          withTraffic
        );
      } else if (functionName === "invalidFunction") {
        const { errorMessage } = data;
        htmlStream = errorMessage;
        disabled = false;
      }
    } catch (err) {
      console.log("Error fetching data from LLM", err);
    }
  };

  // Function to send LLM's response to the user
  const generateHTMLStream = async (response: Record<string, any>) => {
    try {
      const postResponse = await fetch("/api/locationResponseToText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: input,
          locationResponse: JSON.stringify(response),
        }),
      });

      // Reader for LLM's response stream
      const reader = postResponse.body
        ?.pipeThrough(new TextDecoderStream())
        .getReader();

      // Clear html stream
      htmlStream = "";

      // Read till the stream ends
      while (true && reader) {
        const { value, done } = await reader.read();
        if (done) {
          disabled = false;
          break;
        }
        htmlStream += value;
      }
    } catch (err) {
      console.log("Error fetching stream from LLM", err);
    }
  };

  // Function to clear existing markers and routes on the map
  const clearMap = () => {
    // clear existing markers on the map
    for (const marker of markers) {
      marker.setMap(null);
    }
    // De-reference all markers
    markers = [];

    // Clear existing routes on the map
    if (!directionsRenderer) {
      directionsRenderer = new google.maps.DirectionsRenderer();
    } else {
      directionsRenderer?.setMap(null);
    }
  };
</script>

<svelte:head>
  <title>Open AI Integration w/ Google Maps</title>
</svelte:head>

<main class="p-8 h-screen flex justify-center">
  <div class="flex flex-col h-full flex-grow items-center gap-6 w-full">
    <div
      class="h-96 border border-slate-300 bg-gray-100 w-full flex-grow flex flex-col lg:flex-row lg:flex-wrap rounded-md p-8 gap-8"
    >
      <div class="lg:flex-1 w-full lg:h-full h-1/2">
        {#if showTrafficView}
          <iframe
            title="route"
            src={`https://www.google.com/maps/embed/v1/directions?key=${PUBLIC_MAP_API_KEY}&origin=${iframeOrigin}&destination=${iframeDestination}`}
            width="100%"
            height="100%"
            allowfullscreen
            loading="lazy"
          />
        {:else}
          <section bind:this={mapDiv} class="h-full w-full" />
        {/if}
      </div>
      <div
        class="lg:flex-1 w-full lg:h-full h-1/2 flex flex-col gap-4 justify-between"
      >
        <div class="flex items-center gap-2">
          <h1 class="text-xl lg:text-2xl font-semibold">
            Open AI Integration w/ Google Maps
          </h1>
          <button
            class="px-2 py-1 text-[10px] lg:text-xs font-medium cursor-pointer flex bg-gray-200 rounded-md items-center gap-1 lg:gap-2 text-gray-500"
            on:click={() => {
              modalVisibility = !modalVisibility;
            }}
          >
            Support
            <div class="size-4 lg:size-5">
              <SupportIcon />
            </div>
          </button>
        </div>

        <div
          bind:this={contentDiv}
          class="flex-grow bg-gray-200 rounded-md border border-gray-300 overflow-auto p-8"
        >
          {@html htmlStream}
        </div>

        <div class="flex w-full">
          <input
            {disabled}
            bind:value={input}
            placeholder="How far is Paris from Berlin?"
            class="focus-visible:outline-none focus-visible:ring-2 ring-gray-400 flex-grow p-3 rounded-md text-gray-500 bg-white disabled:bg-gray-200 border border-gray-300 rounded-r-none border-r-0 text-sm lg:text-base"
          />

          <button
            {disabled}
            on:click={() => {
              // Disable input and clear output
              disabled = true;
              htmlStream = "";

              // Send user's input to LLM
              generateLocationRequest();
            }}
            class="px-3 hover:bg-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 ring-gray-900 disabled:bg-gray-400 disabled:border-gray-400 text-white rounded-md bg-gray-700 border border-gray-700 rounded-l-none border-l-0"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  </div>
</main>

{#if modalVisibility}
  <SupportModal
    closeModal={() => {
      modalVisibility = false;
    }}
  />
{/if}
