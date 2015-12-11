class MyApplication < Sinatra::Base

  get "/" do
    @title = "Choose your Route"
    @hide_routes_list = true
    @hide_join_up = true

    @page  = params[:page]
    if @page == nil
      @page = 1
    else
      @page = @page.to_i
    end

    if @page <= 0
      @page = 1
    end



    @size = 10
    @pagecount = Ride.where( "date >= ?" , Date.new ).count / @size

    @rides = Ride.order( date: :desc ).paginate( page: @page , per_page: @size ).where( "date >= ?" , Date.new )

    # @ride.route['points'][0]['name']
    # @ride.route['points'][0]['address']

    erb :index
  end

  get "/rides/new" do
    @title = "Create Route"
    @hide_create_route = true
    @hide_join_up = true
    @ride = Ride.new
    erb :new
  end

  post "/rides/new" do
    @title = "Create Route"
    @hide_create_route = true
    @ride = Ride.new( params["ride"] )
    @ride.members = JSON.generate({ members: [] })
    @ride.save
    if @ride.errors.size > 0
      erb :new
    else
      redirect "/rides/#{@ride.id}"
    end
  end

  post "/rides/:id/members" do
    @ride = Ride.find(params['id'])
    @ride.members['members'].push({ email: params['ride']['members']})
    @ride.save
    if @ride.errors.empty?
      redirect "/rides/#{@ride.id}"
    end
  end

  get "/rides/:id" do
    @title = "Route Info"
    ride_id =  params[:id]
    @ride = Ride.find(ride_id)
    @members_count = @ride.members['members'].count + 1
    @miles = '%.2f' % @ride.route['meters'].meters.to.miles

    erb :show
  end

end
