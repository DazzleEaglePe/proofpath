import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';

/**
 * Sin providers ni repositorios: la lectura y clasificacion son funciones puras
 * y este modulo no escribe en la base. Ver 00-CONTEXT §2.2.
 */
@Module({ controllers: [CertificatesController] })
export class CertificatesModule {}
