'use client'

export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang='en'>
            <body>
                <style>{`
                    body {
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #ffffff;
                        color: #18181b;
                        font-family: system-ui, sans-serif;
                    }
                    @media (prefers-color-scheme: dark) {
                        body { background: #09090b; color: #f4f4f5; }
                        p { color: #a1a1aa; }
                    }
                    p { color: #52525b; line-height: 1.5; }
                    button {
                        cursor: pointer;
                        border: 0;
                        border-radius: 999px;
                        padding: 10px 18px;
                        font-weight: 700;
                        background: #db2777;
                        color: white;
                    }
                `}</style>
                <div style={{ textAlign: 'center', padding: 24, maxWidth: 420 }}>
                    <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ margin: '0 0 20px' }}>
                        The page crashed while loading. A reload usually brings
                        it back.
                    </p>
                    <button
                        type='button'
                        onClick={() => {
                            reset()
                            window.location.reload()
                        }}
                    >
                        Reload
                    </button>
                </div>
            </body>
        </html>
    )
}
