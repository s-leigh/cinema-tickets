import TicketService from "../../src/pairtest/TicketService";
import InvalidPurchaseException from "../../src/pairtest/lib/InvalidPurchaseException";
import TicketTypeRequest from "../../src/pairtest/lib/TicketTypeRequest";
import TicketPaymentService from "../../src/thirdparty/paymentgateway/TicketPaymentService"
import SeatReservationService from "../../src/thirdparty/seatbooking/SeatReservationService.js"

const mockMakePayment = jest.fn()
const mockReserveSeat = jest.fn()

jest.mock("../../src/thirdparty/paymentgateway/TicketPaymentService")
jest.mock("../../src/thirdparty/seatbooking/SeatReservationService.js")

let ticketService

beforeEach(() => {
    TicketPaymentService.mockImplementation(() => ({
        makePayment: mockMakePayment
    }))
    SeatReservationService.mockImplementation(() => ({
        reserveSeat: mockReserveSeat
    }))
    ticketService = new TicketService()
})

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

test('Calls payment service correctly for 2 adults and 2 children', () => {
    const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('CHILD', 2)]
    ticketService.purchaseTickets(1, ...ticketRequests)
    expect(mockMakePayment).toHaveBeenCalledWith(1, 6000)
})

test('Calls seat reservation service correctly for 2 adults and 2 children', () => {
    const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('CHILD', 2)]
    ticketService.purchaseTickets(1, ...ticketRequests)
    expect(mockReserveSeat).toHaveBeenCalledWith(1, 4)
})

test('Does not reserve seats for infants', () => {
    const ticketRequests = [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('INFANT', 2)]
    ticketService.purchaseTickets(1, ...ticketRequests)
    expect(mockReserveSeat).toHaveBeenCalledWith(1, 2)
})
