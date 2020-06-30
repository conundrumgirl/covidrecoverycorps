import React, { useState, useEffect } from 'react'
import { makeStyles, Grid, Card } from '@material-ui/core'
import {
  AppointmentParticipant,
  ColumbiaAppointmentAddress,
  GoogleAPIKey,
} from '../../types/types'
import { ReactComponent as ColumbiaLogo } from '../../assets/columbia_logo.svg'
import { ReactComponent as SageLogo } from '../../assets/sage_logo.svg'
import { ReactComponent as MapMarker } from '../../assets/map_marker.svg'
import QRCode from 'qrcode.react'
import moment, { Moment } from 'moment'
import { UserService } from '../../services/user.service'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import 'moment/locale/es'
import GoogleMapReact from 'google-map-react'
import Geocode from 'react-geocode'

const MarkerComponent = ({ text }: any) => (
  <div>
    <MapMarker />
    <div style={{ width: '100px', fontSize: '1.2rem', textAlign: 'center' }}>
      {text}
    </div>
  </div>
)

type AppointmentProps = {
  token?: string
}

type LocationObject = {
  address?: string
  addressObject: ColumbiaAppointmentAddress
  lat?: number
  lng?: number
}

type BookedAppointment = {
  start: Moment
  patient: {
    reference: string
    display: string
  }
  address?: LocationObject
}

Geocode.setApiKey(GoogleAPIKey)
Geocode.enableDebug()

// set response language. Defaults to english.
Geocode.setLanguage(i18next.language)

export const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: '#f5f5f5',
  },
  appointmentContainerDiv: {
    margin: '0px 30px 0 30px',
  },
  mapContainerDiv: {
    height: '400px',
    margin: '0 -30px 0 -30px',
  },

  appointmentDateHeader: {
    color: '#FC9090',
    fontWeight: 'bold',
    marginTop: '30px',
  },
  appointmentInstructions: {
    marginTop: '30px',
  },
  logosDiv: {
    padding: '40px 30px',
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  logosDivSeparator: {
    width: '5px',
    borderRight: '2px #EEEEEE solid',
    margin: '0px 50px',
    [theme.breakpoints.down('sm')]: {
      borderRight: '0px #EEEEEE solid',
      margin: '10px 5px',
    },
  },
  logo: {
    height: '50px',
    maxWidth: '200px',
  },
  qrCode: {
    margin: '3rem auto',
    textAlign: 'center',
  },
}))
export const Appointment: React.FunctionComponent<AppointmentProps> = ({
  token,
}: AppointmentProps) => {
  const classes = useStyles()
  const [appointment, setAppointment] = useState<BookedAppointment>()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState()
  const { t } = useTranslation()

  const getCodedLocation = async (
    addressObject: ColumbiaAppointmentAddress,
  ): Promise<LocationObject> => {
    const result: LocationObject = {
      addressObject,
    }

    try {
      const address = `${addressObject.line.join(',')}, ${
        addressObject.city
      }, ${addressObject.state}  ${addressObject.postalCode}`
      result.address = address
    } catch {
      return Promise.resolve(result)
    }
    try {
      const response = await Geocode.fromAddress(result.address)
      const { lat, lng } = response.results[0].geometry.location
      result.lat = lat as number
      result.lng = lng as number
    } catch (e) {
      setError(e)
    } finally {
      return result
    }
  }

  useEffect(() => {
    let isSubscribed = true
    const getInfo = async () => {
      if (token && isSubscribed) {
        try {
          setIsLoading(true)
          const appointmentsResponse = await UserService.getAppointments(token)
          if (appointmentsResponse?.data?.items?.length > 0) {
            const appt = appointmentsResponse.data.items[0]
            if (appt.data.status === 'booked') {
              const patient = getInfoPiece(appt.data.participant, 'Patient')!
              const location = getInfoPiece(appt.data.participant, 'Location')
              const codedLocation = location?.address
                ? await getCodedLocation(location?.address)
                : undefined
              const appointment: BookedAppointment = {
                start: moment(appt.data.start),
                patient,
                address: codedLocation,
              }

              setAppointment(appointment)
            }
          }
        } catch (e) {
          setError(e)
        } finally {
          setIsLoading(false)
        }
      }
    }
    getInfo()
    return () => {
      isSubscribed = false
    }
  }, [token])

  const getInfoPiece = (
    participant: AppointmentParticipant[] | undefined,
    type: 'Patient' | 'Location',
  ) => {
    const result = participant?.find(item =>
      item.actor.reference.includes(`${type}/`),
    )
    return result?.actor
  }

  const renderAppointment = (appointment: BookedAppointment) => {
    const appointmentDateTime = appointment.start

    const reference = appointment.patient.reference.split('Patient/')[1]
    const friendlyAppointmentTimeStart = appointmentDateTime
      .locale(i18next.language)
      .format('h:mm a')
    const appointmentDateTimeEnd = appointment.start.add(30, 'minutes')
    const friendlyAppointmentTimeEnd = appointmentDateTimeEnd
      .locale(i18next.language)
      .format('h:mm a')

    return (
      <Card className={classes.root}>
        <div className={classes.appointmentContainerDiv}>
          <h2 className="text-center">Appointment confirmation</h2>
          <p>Your lab appointment has been confirmed for:</p>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item>
              <div className={classes.appointmentDateHeader}>DATE</div>

              <div>
                {appointmentDateTime.locale(i18next.language).format('dddd')}
              </div>
              <div>
                <strong>
                  {appointmentDateTime
                    .locale(i18next.language)
                    .format('MMMM Do, YYYY')}
                </strong>
              </div>
              <div>
                <strong>
                  {friendlyAppointmentTimeStart} - {friendlyAppointmentTimeEnd}
                </strong>
              </div>
            </Grid>
          </Grid>
          {appointment.address?.address && (
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="center"
            >
              <Grid item>
                <div className={classes.appointmentDateHeader}>LOCATION</div>
                {appointment.address.addressObject.line[0]
                  ? appointment.address.addressObject.line[0]
                  : ''}

                {appointment.address.addressObject.line[1] && (
                  <div>appointment.address.addressObject.line[1]</div>
                )}
                <div>
                  {`${appointment.address.addressObject.city}, ${appointment.address.addressObject.state} ${appointment.address.addressObject.postalCode}`}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    appointment.address.address,
                  )}`}
                  target="_blank"
                >
                  View Map
                </a>
              </Grid>
            </Grid>
          )}
          <div className={classes.appointmentInstructions}>
            <p>
              You will stop at the main Information desk in the lobby and will
              be directed to the proper location. Please bring this email on
              your smartphone or a printout of this email with you to your
              appointment.
            </p>
            <p>
              As a token of our appreciation, all participants who complete all
              of the surveys and provide a lab sample will receive a $50 gift
              card. Please complete the four surveys prior to your lab
              appointment.
            </p>
            <div className={classes.qrCode}>
              <QRCode value={reference || ''} />
            </div>
            <p>
              If you have a fever, cough, sore throat, shortness of breath,
              diarrhea, or body aches, you should not come to have your blood
              drawn.
            </p>
            <p>
              If you need to reschedule your appointment or need assistance,
              call 212-305-5700 or email{' '}
              <a href="mailto:COVIDRecoveryCorps@cumc.columbia.edu">
                COVIDRecoveryCorps@cumc.columbia.edu
              </a>
            </p>
          </div>

          <div className={classes.logosDiv}>
            <ColumbiaLogo className={classes.logo} />
            <div className={classes.logosDivSeparator}></div>
            <SageLogo className={classes.logo} />
          </div>
          {appointment.address?.lat !== undefined && (
            <div className={classes.mapContainerDiv}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: GoogleAPIKey }}
                defaultCenter={{
                  lat: appointment.address!.lat!,
                  lng: appointment.address.lng!,
                }}
                defaultZoom={11}
              >
                <MarkerComponent
                  lat={appointment.address!.lat!}
                  lng={appointment.address!.lng}
                  text={appointment.address.addressObject.line[0]}
                />
              </GoogleMapReact>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return <div>{appointment && <div>{renderAppointment(appointment)}</div>}</div>
}

export default Appointment
