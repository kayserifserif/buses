from bs4 import BeautifulSoup
import requests

def main():
    url = 'https://www.mbta.com/schedules/bus'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'html.parser')

    routes = [s.string.strip() for s in soup.find_all('span', class_='c-grid-button__name')]
    routes = [r for r in routes if r[:2] != 'SL']   # SL routes have weird URLs

    with open('routes_file.txt', 'w') as routes_file:
        for route in routes:
            route_url = f'https://www.mbta.com/schedules/{route}'
            route_page = requests.get(route_url)
            route_soup = BeautifulSoup(route_page.text, 'html.parser')

            route_name = route_soup.find('h2', class_='schedule__description')
            if route_name is None:
                continue
            route_name = route_name.string.strip()

            stops = route_soup.find('select', class_='c-select-custom c-select-custom--noclick notranslate')
            stops = [s.string for s in stops.contents if 'aria-label' in s.attrs]
            stops = ','.join(stops)

            print(route)
            print(route_name)
            print(stops)
            routes_file.write(route + '\n')
            routes_file.write(route_name + '\n')
            routes_file.write(stops + '\n')

if __name__ == '__main__':
    main()
