import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trim, trimEnd } from 'lodash';

/**
 * Builds routes for the web application given a base URL and a path.
 */
@Injectable()
export class ClientRouteBuilder {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.prepareBase(this.config.get('api.webBaseUrl'));
    this.checkBaseUrl();
  }

  build(path = '', queryParams?: Record<string, string>, customBase?: string) {
    const query = queryParams ? '?' + new URLSearchParams(queryParams) : '';
    return new URL(
      `${trim(path, ' /?')}${query}`,
      customBase || this.baseUrl,
    ).toString();
  }

  private prepareBase(url: any) {
    return trimEnd(url, '/');
  }

  private checkBaseUrl() {
    let url: URL;
    try {
      url = new URL(this.baseUrl);
    } catch (error) {
      throw Error(`Invalid client base URL: ${this.baseUrl}`);
    }
    this.checkUrlProtocol(url);
  }

  private checkUrlProtocol(url: URL) {
    if (!(url.protocol === 'http:' || url.protocol === 'https:')) {
      throw Error(
        `Invalid client URL protocol. Must be one 'http' or 'https', '${url.protocol}' given`,
      );
    }
  }
}
