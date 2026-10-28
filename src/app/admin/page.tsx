import Link from 'next/link'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export default function AdminHomePage() {
    return (
        <div className='grid gap-4 sm:grid-cols-2'>
            <Link
                href='/admin/tickets'
                className='rounded-lg bg-white p-6 shadow-sm transition-colors hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800'
            >
                <h2 className={`${proximaNovaBold.className} text-lg uppercase`}>Tickets</h2>
                <p className='mt-2 text-sm text-gray-600 dark:text-zinc-400'>Read and reply to feedback.</p>
            </Link>
            <Link
                href='/admin/announcements'
                className='rounded-lg bg-white p-6 shadow-sm transition-colors hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800'
            >
                <h2 className={`${proximaNovaBold.className} text-lg uppercase`}>Announcements</h2>
                <p className='mt-2 text-sm text-gray-600 dark:text-zinc-400'>
                    Publish a live message to everyone on the site.
                </p>
            </Link>
            <Link
                href='/admin/giveaways'
                className='rounded-lg bg-white p-6 shadow-sm transition-colors hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800'
            >
                <h2 className={`${proximaNovaBold.className} text-lg uppercase`}>Giveaways</h2>
                <p className='mt-2 text-sm text-gray-600 dark:text-zinc-400'>
                    Run a raffle and credit the winner&apos;s idol pick.
                </p>
            </Link>
        </div>
    )
}
