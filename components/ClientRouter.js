import { withRouter } from 'next/router'
import { ClientRouter as AppBridgeClientRouter } from '@shopify/app-bridge-react'

const ClientRouter = (props) => <AppBridgeClientRouter history={props.router} />

export default withRouter(ClientRouter)
