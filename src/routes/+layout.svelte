<script>
  // For globally including TailwindCSS
  import "../app.css";

  // Google Maps API Key
  import { PUBLIC_MAP_API_KEY } from "$env/static/public";
</script>

<svelte:head>
  <script
    src={`https://maps.googleapis.com/maps/api/js?key=${PUBLIC_MAP_API_KEY}&v=weekly&libraries=places`}
  ></script>
</svelte:head>

<slot />
