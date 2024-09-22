# rtbookings
Calendly Integration with HaloPSA

## HaloPSA Setup
Create a HaloPSA API Application, and choose "Authorisation Code". Use the Client ID and Secret in Environment variables mentioned below.

You'll need to specify the URL HaloPSA is allowed to redirect the user back to (the public hostname of your app) which will need to match the Redirect URL of the environment variable below

`HALOPSA_BASE_URL` - HaloPSA base URL e.g https://halo.domain.com

`HALOPSA_CLIENT_ID` - HaloPSA Client ID for the above app

`HALOPSA_CLIENT_SECRET` - HaloPSA CLient Secret for the above app

`HALOPSA_REDIRECT_URI` - Callback URL of this booking app that Halo will redirect you back to, e.g https://booking.domain.com/oauth/callback

Set the "Allow Users to login" and any branding you desire. Make sure it's not forced to a single client.

Under the Permissions tab, set your scopes to `read:tickets` and `read:customers`, if you want additional scopes you can add them here and update the ENV variable for `HALOPSA_SCOPES`

Optionally if you like you can add `HALOPSA_TENANT` which will let you specify the hosted tenant name, available in your HaloPSA API General configuration page.

Under the Authentication Options tab you can decide what login experience you want your users to see

## HaloPSA Ticket Setup
For the ticket creation you'll need to define an anonymous ticket type that will be served in an iframe form. In HaloPSA open the ticket **Configuration > Tickets/Sales > Ticket/Opportunity Types** and then pick the ticket type you want to use, and on the **Details** tab allow anonymous logging of the ticket. Then on the **Form** tab grab the Ticket Type ID and Key from the URL or HTML code and set the following variables.

`HALOPSA_TICKET_TYPE_ID` - Ticket Type ID in HaloPSA to display

`HALOPSA_TICKET_TYPE_KEY` - Ticket Anonymous Token Key from the HTML Script Halo provides

Inside the ticket type settings make sure you specify the domain of the bookings app in the CORS Policy

## Custom branding
`BRAND_COLOR` - Setting the brand color

`TEXT_COLOR` - Main text color.

`BUTTON_BG_COLOR` - Button background color.

`BUTTON_TEXT_COLOR` - Button text color.

`BUTTON_HOVER_BG_COLOR` - Button background color on hover.

`BUTTON_HOVER_TEXT_COLOR` - Button text color on hover.

`LOGO_URL` - Setting the Logo URL which can be a public URL


## All Env Variables
For convenience here's a code block of all environment variables that can be set so you can copy/paste in one shot.

```
HALOPSA_BASE_URL = 
HALOPSA_CLIENT_ID =
HALOPSA_CLIENT_SECRET =
HALOPSA_REDIRECT_URI =
HALOPSA_TICKET_TYPE_ID =
HALOPSA_TICKET_TYPE_KEY =
BRAND_COLOR =
TEXT_COLOR =
BUTTON_BG_COLOR =
BUTTON_TEXT_COLOR =
BUTTON_HOVER_BG_COLOR =
BUTTON_HOVER_TEXT_COLOR =
LOGO_URL =
```