import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import vnProvinces from 'vn-provinces';

@Controller('api/location')
export class ProvincesController {
  // Lấy danh sách tất cả tỉnh/thành phố
  @Get('provinces')
  getProvinces() {
    return vnProvinces.getProvinces();
  }

  // Lấy danh sách huyện theo tỉnh (theo provinceCode)
  @Get('districts/:provinceCode')
  getDistricts(@Param('provinceCode') provinceCode: string) {
    const districts = vnProvinces.getDistricts();
    const filteredDistricts = districts.filter(
      (d) => d.provinceCode.toString() === provinceCode,
    );
    if (filteredDistricts.length === 0) {
      throw new NotFoundException('Không tìm thấy huyện cho tỉnh này');
    }
    return filteredDistricts;
  }

  // Lấy danh sách xã theo huyện (theo districtCode)
  @Get('wards/:districtCode')
  getWards(@Param('districtCode') districtCode: string) {
    const wards = vnProvinces.getWards();
    const filteredWards = wards.filter(
      (w) =>
        (w as any).districtCode?.toString() === districtCode ||
        (w as any).district_code?.toString() === districtCode,
    );
    if (filteredWards.length === 0) {
      throw new NotFoundException('Không tìm thấy xã/phường cho huyện này');
    }
    return filteredWards;
  }
}
