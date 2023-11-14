import TicketService from '../../src/pairtest/TicketService'
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException'
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest'
import TicketPaymentService from '../../src/thirdparty/paymentgateway/TicketPaymentService'
import SeatReservationService from '../../src/thirdparty/seatbooking/SeatReservationService.js'

let mockMakePayment
let mockReserveSeat

jest.mock('../../src/thirdparty/paymentgateway/TicketPaymentService')
jest.mock('../../src/thirdparty/seatbooking/SeatReservationService.js')

let ticketService

describe('TicketService', () => {
  beforeEach(() => {
    TicketPaymentService.mockClear()
    SeatReservationService.mockClear()
    mockMakePayment = jest.fn()
    mockReserveSeat = jest.fn()
    TicketPaymentService.mockImplementation(() => ({
      makePayment: mockMakePayment
    }))
    SeatReservationService.mockImplementation(() => ({
      reserveSeat: mockReserveSeat
    }))
    ticketService = new TicketService()
  })

  describe('Input validation', () => {
    test('Throws InvalidPurchaseException when given an invalid account ID', () => {
      const validTicketRequest = new TicketTypeRequest('ADULT', 1)
      const purchaseFn = () => ticketService.purchaseTickets(0, validTicketRequest)
      expect(purchaseFn).toThrow(InvalidPurchaseException)
    })

    test('Throws InvalidPurchaseException when >20 tickets requested', () => {
      const ticketRequest = new TicketTypeRequest('ADULT', 21)
      const purchaseFn = () => ticketService.purchaseTickets(1, ticketRequest)
      expect(purchaseFn).toThrow(InvalidPurchaseException)
    })

    test('Throws InvalidPurchaseException when no adult tickets are requested', () => {
      const ticketRequests = [new TicketTypeRequest('CHILD', 1), new TicketTypeRequest('INFANT', 1)]
      const purchaseFn = () => ticketService.purchaseTickets(1, ...ticketRequests)
      expect(purchaseFn).toThrow(InvalidPurchaseException)
    })

    test('Throws InvalidPurchaseException when more infant tickets are requested than adult tickets', () => {
      const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('INFANT', 3)]
      const purchaseFn = () => ticketService.purchaseTickets(1, ...ticketRequests)
      expect(purchaseFn).toThrow(InvalidPurchaseException)
    })

    test('Throws InvalidPurchaseException when <0 tickets are requested', () => {
      const ticketRequests = [new TicketTypeRequest('ADULT', -1), new TicketTypeRequest('ADULT', 3)]
      const purchaseFn = () => ticketService.purchaseTickets(1, ...ticketRequests)
      expect(purchaseFn).toThrow(InvalidPurchaseException)
    })
  })

  describe('Payment and seat reservations', () => {
    test('Calls payment service correctly for 2 adults, 2 children, 2 infants', () => {
      const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('CHILD', 2), new TicketTypeRequest('INFANT', 2)]
      ticketService.purchaseTickets(1, ...ticketRequests)
      expect(mockMakePayment).toHaveBeenCalledWith(1, 6000)
    })

    test('Calls seat reservation service correctly for 2 adults, 2 children, 2 infants', () => {
      const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('CHILD', 2), new TicketTypeRequest('INFANT', 2)]
      ticketService.purchaseTickets(1, ...ticketRequests)
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4)
    })

    test('Does not call payment or seat reservation services if no tickets are requested', () => {
      const ticketRequests = [new TicketTypeRequest('ADULT', 0)]
      ticketService.purchaseTickets(1, ...ticketRequests)
      expect(mockMakePayment).not.toHaveBeenCalled()
      expect(mockReserveSeat).not.toHaveBeenCalled()
    })
  })
})
