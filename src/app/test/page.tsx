export default function TestPage() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>🎉 Server Funzionante\!</h1>
      <p>Se vedi questa pagina, il server Next.js sta funzionando correttamente.</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  )
}
