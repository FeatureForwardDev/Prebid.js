import * as utils from 'src/utils';
import { registerBidder } from '../src/adapters/bidderFactory';
import { BANNER } from '../src/mediaTypes';

export const BIDDER_CODE = 'nanointeractive';
export const ENGINE_BASE_URL = 'http://tmp.audiencemanager.de/hb';

export const SECURITY = 'sec';
export const DATA_PARTNER_ID = 'dpid';
export const DATA_PARTNER_PIXEL_ID = 'pid';
export const ALG = 'alg';
export const NQ = 'nq';
export const NQ_NAME = 'name';
export const CATEGORY = 'category';

const DEFAULT_ALG = 'ihr';

export const spec = {

  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],

  isBidRequestValid(bid) {
    const sec = bid.params[SECURITY];
    const dpid = bid.params[DATA_PARTNER_ID];
    const pid = bid.params[DATA_PARTNER_PIXEL_ID];
    return !!(sec && dpid && pid);
  },
  buildRequests(bidRequests) {
    let payload = [];
    bidRequests.forEach(bid => payload.push(createSingleBidRequest(bid)));
    return {
      method: 'POST',
      url: ENGINE_BASE_URL,
      data: JSON.stringify(payload)
    };
  },
  interpretResponse(serverResponse) {
    const bids = [];
    serverResponse.forEach(serverBid => {
      if (isEngineResponseValid(serverBid)) {
        bids.push(createSingleBidResponse(serverBid));
      }
    });
    return bids;
  }
};

function createSingleBidRequest(bid) {
  return {
    [SECURITY]: bid.params[SECURITY],
    [DATA_PARTNER_ID]: bid.params[DATA_PARTNER_ID],
    [DATA_PARTNER_PIXEL_ID]: bid.params[DATA_PARTNER_PIXEL_ID],
    [ALG]: bid.params[ALG] || DEFAULT_ALG,
    [NQ]: [createNqParam(bid), createCategoryParam(bid)],
    sizes: bid.sizes.map(value => value[0] + 'x' + value[1]),
    bidId: bid.bidId,
    cors: utils.getOrigin()
  };
}

function createSingleBidResponse(serverBid) {
  return {
    requestId: serverBid.id,
    cpm: serverBid.cpm,
    width: serverBid.width,
    height: serverBid.height,
    ad: serverBid.ad,
    ttl: serverBid.ttl,
    creativeId: serverBid.creativeId,
    netRevenue: serverBid.netRevenue || true,
    currency: serverBid.currency,
  };
}

function createNqParam(bid) {
  return bid.params[NQ_NAME] ? utils.getParameterByName(bid.params[NQ_NAME]) : bid.params[NQ] || null;
}

function createCategoryParam(bid) {
  return bid.params[CATEGORY] || null;
}

function isEngineResponseValid(response) {
  return !!response.cpm && !!response.ad;
}

registerBidder(spec);
