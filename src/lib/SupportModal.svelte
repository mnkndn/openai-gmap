<script lang="ts">
  import CloseIcon from "$lib/icons/CloseIcon.svelte";
  import TickIcon from "$lib/icons/TickIcon.svelte";
  import BanIcon from "$lib/icons/BanIcon.svelte";

  export let closeModal: () => void;
</script>

<div
  aria-describedby="button"
  on:click={closeModal}
  on:keyup={() => {
    // Dummy function to circumvent svelte's accessibility warnings
    // Refer - https://github.com/sveltejs/language-tools/issues/650
  }}
  role="button"
  tabindex={0}
  class="h-screen w-screen p-8 bg-black/40 backdrop-blur-sm absolute top-0 left-0 z-10 flex items-center justify-center"
>
  <div
    on:click={(e) => {
      e.stopPropagation();
    }}
    on:keyup={() => {
      // Dummy function to circumvent svelte's accessibility warnings
      // Refer - https://github.com/sveltejs/language-tools/issues/650
    }}
    role="button"
    tabindex={1}
    class="bg-gray-100 max-h-[95%] overflow-auto cursor-auto rounded-md shadow-2xl max-w-4xl p-8 pt-12 flex flex-col lg:flex-row gap-8 relative"
  >
    <button
      on:click={(e) => {
        e.stopPropagation();
        closeModal();
      }}
      class="absolute right-2 top-2 text-gray-500"
    >
      <CloseIcon />
    </button>
    <div class="border bg-gray-50 border-gray-100 rounded-lg p-4">
      <ul class="flex flex-col gap-4">
        <div
          class="font-medium bg-green-100 text-green-600 rounded-lg px-3 py-1 w-fit flex items-center gap-2"
        >
          Supported
          <div class="w-4 h-4">
            <TickIcon />
          </div>
        </div>
        <li class="font-semibold">
          Routes
          <ul class="font-light list-disc pl-4">
            <li>Route calculations between two locations</li>
            <li>Route with traffic information</li>
            <li>Support for bike/car/public transit/walking routes</li>
            <li>Distance between two locations</li>
          </ul>
        </li>
        <li class="font-semibold">
          Nearby Places
          <ul class="font-light list-disc pl-4">
            <li>Find nearby places around a given location</li>
          </ul>
        </li>
      </ul>
    </div>
    <div class="border bg-gray-50 border-gray-100 rounded-lg p-4">
      <ul class="flex flex-col gap-4">
        <div
          class="font-medium bg-red-100 text-red-600 rounded-lg px-3 py-1 w-fit flex items-center gap-2"
        >
          Not Supported
          <div class="w-4 h-4">
            <BanIcon />
          </div>
        </div>
        <ul class="flex flex-col gap-4">
          <li class="font-semibold">
            General
            <ul class="font-light list-disc pl-4">
              <li>Queries unrelated to maps</li>
            </ul>
          </li>
          <li class="font-semibold">
            Routes
            <ul class="font-light list-disc pl-4">
              <li>Distance/Route calculations around a single location</li>
              <li>Multiple routes/waypoints</li>
              <li>Routes to/from current location</li>
              <li>Step by step navigation</li>
              <li>Places along a route</li>
            </ul>
          </li>
          <li class="font-semibold">
            Nearby Places
            <ul class="font-light list-disc pl-4">
              <li>Search places from current location</li>
              <li>Places based on ratings/timings</li>
            </ul>
          </li>
        </ul>
      </ul>
    </div>
  </div>
</div>
