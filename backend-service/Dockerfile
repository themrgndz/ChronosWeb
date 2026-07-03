# 1. Aşama: Maven ile projeyi derleme
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Docker projenin içine girip build başlattığı için 
# doğrudan bulunduğumuz dizindeki pom.xml ve src'yi alıyoruz brom
COPY pom.xml .
COPY src ./src

# Testleri pas geçerek hızlıca jar paketini üretelim agam
RUN mvn clean package -DskipTests

# 2. Aşama: Sadece çalıştırma ortamı
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# İlk aşamada üretilen jar dosyasını buraya taşıyoruz
COPY --from=build /app/target/*.jar app.jar

# traffic.csv dosyasını runtime için kaynak klasörüne yerleştiriyoruz
COPY src/main/resources/traffic.csv src/main/resources/traffic.csv

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]