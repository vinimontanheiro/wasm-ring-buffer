import { Buffer } from "buffer";

const MAX_SIZE = {
  TYPE: 127,
  HEADER: 12,
  SEQUENCE: 65535,
  TIMESTAMP: 4294967295,
  SOURCE: 4294967295,
};

const getRandomInt = min => {
  const minCeil = Math.ceil(min || 10000);
  return Math.floor(Math.random() * minCeil) + minCeil;
};

class RTPBuilder {

  constructor(payloadSize = 160, automatic = true){
    this._payloadSize = payloadSize;
    this._packetSize = this._payloadSize + MAX_SIZE.HEADER;
    this._automatic = automatic;
    this._rtp = new Buffer(this._packetSize);
    this._rtp[0] = 0x80;
    this._rtp[1] = 0;
    this._rtp[2] = 0;
    this._rtp[3] = 0;
    this._rtp[4] = 0;
    this._rtp[5] = 0;
    this._rtp[6] = 0;
    this._rtp[7] = 0;
    this._rtp[8] = 0;
    this._rtp[9] = 0;
    this._rtp[10] = 0;
    this._rtp[11] = 1;

    if(this._automatic){
      this.setSource(getRandomInt(10000));
      this.setSequence(getRandomInt(100));
    }
  }

  toUnsigned(value) {
    return (value >>> 1) * 2 + (value & 1);
  }

  setPayloadType(type){
    const payloadType = this.toUnsigned(type);
    if (payloadType <= MAX_SIZE.TYPE) {
      this._rtp[1] -= this._rtp[1] & 0x7f;
      this._rtp[1] |= payloadType;
    }
  }

  getSequence(){
    return (this._rtp[2] << 8) | this._rtp[3];
  }

  setSequence(seq){
    const sequence = this.toUnsigned(seq);
    if (sequence <= MAX_SIZE.SEQUENCE) {
      this._rtp[2] = sequence >>> 8;
      this._rtp[3] = sequence & 0xff;
    }else{
      this.setSequence(getRandomInt(100));
    }
  }

  getTimestamp(){
    return (
      (this._rtp[4] << 24) | (this._rtp[5] << 16) | (this._rtp[6] << 8) | this._rtp[7]
    );
  }

  setTimestamp(time){
    const timestamp = this.toUnsigned(time);
    if (timestamp <= MAX_SIZE.TIMESTAMP) {
      this._rtp[4] = timestamp >>> 24;
      this._rtp[5] = (timestamp >>> 16) & 0xff;
      this._rtp[6] = (timestamp >>> 8) & 0xff;
      this._rtp[7] = timestamp & 0xff;
    }else{
      this.setTimestamp(this._payloadSize);
    }
  }

  setSource(src){
    const source = this.toUnsigned(src);
    if (source <= MAX_SIZE.SOURCE) {
      this._rtp[8] = source >>> 24;
      this._rtp[9] = (source >>> 16) & 0xff;
      this._rtp[10] = (source >>> 8) & 0xff;
      this._rtp[11] = source & 0xff;
    }
  }

 next(){
    let nextSequence = this.getSequence() + 1;
    let nextTimestamp = this.getTimestamp() + this._payloadSize;
    this.setSequence(nextSequence);
    this.setTimestamp(nextTimestamp);
  }

 setPayload(buffer){
    if(this._automatic){
      this.next();
    }
    if (Buffer.isBuffer(buffer) && buffer.length <= this._payloadSize) {
        buffer.copy(this._rtp, MAX_SIZE.HEADER, 0);
    }
  }

  getPacket(){
    return this._rtp;
  }

}

export default RTPBuilder;