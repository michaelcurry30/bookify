export default function BrandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#052e16",
        fontFamily: "Inter,system-ui,sans-serif",
        color: "#f0fdf4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "10px" }}>
          Custom Branding
        </h1>
        <p style={{ color: "rgba(240,253,244,0.5)", fontSize: "15px" }}>
          Coming soon — white-label your booking page and messages.
        </p>
      </div>
    </main>
  );
}