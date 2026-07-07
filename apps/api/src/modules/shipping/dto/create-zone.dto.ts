import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
