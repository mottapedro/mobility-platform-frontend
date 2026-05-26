import { redirect } from 'next/navigation'
import { ROLE_ENTRYPOINT } from '../../utils/redirectByRole'

export default function DriverPage() {
  redirect(ROLE_ENTRYPOINT.driver)
}
