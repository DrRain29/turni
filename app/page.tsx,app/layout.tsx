const Page = () => {
  return (
    <div>
      <h1>Welcome to the Page</h1>
      {/* Other content */}
    </div>
  )
}

export default Page

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
</merged_code>
