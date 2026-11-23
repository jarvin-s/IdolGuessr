import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

const missingVariable = token
    ? 'NEXT_PUBLIC_POSTHOG_HOST'
    : 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'

export const posthogLoggerProvider =
    token && host
        ? new LoggerProvider({
            resource: resourceFromAttributes({
                'service.name': 'idol-guessr',
                'service.version': process.env.npm_package_version ?? 'unknown',
                'deployment.environment': process.env.NODE_ENV ?? 'development',
            }),
            processors: [
                new BatchLogRecordProcessor(
                    {
                        exporter: new OTLPLogExporter({
                            url: `${host.replace(/\/$/, '')}/i/v1/logs`,
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            timeoutMillis: 2000,
                        })
                    },
                ),
            ],
        })
        : null

export const posthogServerLogger = posthogLoggerProvider?.getLogger('idol-guessr.posthog')

export function register() {
    if (!posthogLoggerProvider && process.env.NODE_ENV !== 'production') {
        console.warn(
            `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
        )
    }
}

export async function flushPostHogLogs() {
    await posthogLoggerProvider?.forceFlush().catch(() => undefined)
}
