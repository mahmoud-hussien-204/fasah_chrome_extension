const btn = document.getElementById("copyBtn");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
 const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.url) return;

  const { hostname ,...arf} = new URL(tab.url);

  console.log("hostname", hostname, arf);

  const hostnameDomain = hostname.includes("zatca.gov.sa") ? 'zatca.gov.sa' : 'oga.fasah.sa';
  


  await chrome.cookies.getAll(
    {
      domain: hostnameDomain,
    },
    async (cookies) => {
      if (!cookies || cookies.length === 0) {
        show("Token not found", 1200);
        return;
      }

      const getToken = cookies.find((cookie) => cookie.name === "fsession");

      if (!getToken) {
        show("Token not found", 1200);
        return
      }

      const token = decodeURIComponent(getToken.value);

      await navigator.clipboard.writeText(token);
      show("Token copied", 500);
    }
  );
});

function show(text, time) {
  msg.textContent = text;
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), time);
}
