import {
  DynamicModule,
  Global,
  Module,
  type InjectionToken,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { XYIZLE_OPTIONS, type XyizleModuleOptions } from '../constants';
import { XyizleService } from './xyizle.service';

@Global()
@Module({})
export class XyizleModule {
  static forRootAsync(options: {
    imports?: DynamicModule['imports'];
    inject: InjectionToken[];
    useFactory: (
      ...args: unknown[]
    ) => Promise<XyizleModuleOptions> | XyizleModuleOptions;
  }): DynamicModule {
    return {
      module: XyizleModule,
      imports: options.imports,
      providers: [
        {
          provide: XYIZLE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        XyizleService,
      ],
      exports: [XyizleService],
    };
  }

  /**
   * Recommended registration when using a global {@link ConfigModule} with `database.url`.
   */
  static forRootFromConfig(): DynamicModule {
    return XyizleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: ((config: ConfigService) => ({
        connectionString: config.getOrThrow<string>('database.url'),
      })) as (
        ...args: unknown[]
      ) => XyizleModuleOptions | Promise<XyizleModuleOptions>,
    });
  }
}
