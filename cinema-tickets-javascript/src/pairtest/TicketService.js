import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import ThirdPartyServiceException from './lib/ThirdPartyServiceException.js'
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService"
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

const ADULT_TICKET_PRICE_PENCE = 2000
const CHILD_TICKET_PRICE_PENCE = 1000
const MAX_PERMITTED_NUMBER_OF_TICKETS = 20

export default class TicketService {
  constructor(ticketPaymentService = new TicketPaymentService(), seatReservationService = new SeatReservationService()) {
    this.ticketPaymentService = ticketPaymentService
    this.seatReservationService = seatReservationService
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    if (!this.#isValidAccountId(accountId)) {
      throw new InvalidPurchaseException(`Invalid account ID provided: ${accountId}`)
    }

    let totalTicketsRequested = 0
    let adultTickets = 0
    let childTickets = 0
    let infantTickets = 0

    ticketTypeRequests.forEach(request => {
      totalTicketsRequested += request.getNoOfTickets()
      if (request.getTicketType() === 'ADULT') adultTickets += request.getNoOfTickets()
      if (request.getTicketType() === 'CHILD') childTickets += request.getNoOfTickets()
      if (request.getTicketType() === 'INFANT') infantTickets += request.getNoOfTickets()
    })

    if (totalTicketsRequested === 0) return

    if (totalTicketsRequested > MAX_PERMITTED_NUMBER_OF_TICKETS) {
      throw new InvalidPurchaseException(
        `Too many tickets (${totalTicketsRequested}) requested: max ${MAX_PERMITTED_NUMBER_OF_TICKETS}`
      )
    }

    if (adultTickets === 0) {
      throw new InvalidPurchaseException(
        `Child and Infant tickets cannot be purchased without purchasing an Adult ticket.`
      )
    }

    if (adultTickets < infantTickets) {
      throw new InvalidPurchaseException(
        `Infants must sit on an adult's lap, but there are not enough adults (${adultTickets}) for infants (${infantTickets})`
      )
    }

    try {
      this.ticketPaymentService.makePayment(accountId, this.#totalPricePence(adultTickets, childTickets))
    } catch (err) {
      throw new ThirdPartyServiceException(`Could not complete payment transaction for account ${accountId}`, err, "PAYMENT")
    }

    try {
      this.seatReservationService.reserveSeat(accountId, adultTickets + childTickets)
    } catch (err) {
      throw new ThirdPartyServiceException(`Could not complete seat reservation transaction for account ${accountId}`, err, "SEAT_RESERVATION")
    }
  }

  #isValidAccountId(accountId) {
    return accountId > 0
  }

  #totalPricePence(noOfAdults, noOfChildren) {
    return (noOfAdults * ADULT_TICKET_PRICE_PENCE) + (noOfChildren * CHILD_TICKET_PRICE_PENCE)
  }
}
