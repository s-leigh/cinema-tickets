import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
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

    const ticketNumbers = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
      TOTAL: 0
    }

    ticketTypeRequests.forEach(request => {
      const numberOfTickets = request.getNoOfTickets()
      if (numberOfTickets < 0) throw new InvalidPurchaseException(`Number of tickets less than 0 is not allowed (value provided: ${numberOfTickets})`)

      ticketNumbers.TOTAL += numberOfTickets
      ticketNumbers[request.getTicketType()] += numberOfTickets
    })

    if (ticketNumbers.TOTAL === 0) return

    if (ticketNumbers.TOTAL > MAX_PERMITTED_NUMBER_OF_TICKETS) {
      throw new InvalidPurchaseException(
        `Too many tickets (${ticketNumbers.TOTAL}) requested: max ${MAX_PERMITTED_NUMBER_OF_TICKETS}`
      )
    }

    if (ticketNumbers.ADULT === 0) {
      throw new InvalidPurchaseException(
        `Child and Infant tickets cannot be purchased without purchasing an Adult ticket.`
      )
    }

    if (ticketNumbers.ADULT < ticketNumbers.INFANT) {
      throw new InvalidPurchaseException(
        `Infants must sit on an adult's lap, but there are not enough adults (${ticketNumbers.ADULT}) for infants (${ticketNumbers.INFANT})`
      )
    }

    // In real life we would wrap both of these in some kind of atomic transaction
    this.ticketPaymentService.makePayment(accountId, this.#totalPricePence(ticketNumbers.ADULT, ticketNumbers.CHILD))
    this.seatReservationService.reserveSeat(accountId, ticketNumbers.ADULT + ticketNumbers.CHILD)
  }

  #isValidAccountId(accountId) {
    return accountId > 0
  }

  #totalPricePence(noOfAdults, noOfChildren) {
    return (noOfAdults * ADULT_TICKET_PRICE_PENCE) + (noOfChildren * CHILD_TICKET_PRICE_PENCE)
  }
}
